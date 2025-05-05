// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetAllRooms/GetAllRoomsQuery.cs
using System;
using AutoMapper;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces; // IApplicationDbContext için
using Microsoft.EntityFrameworkCore;         // Entity Framework Core metotları için (Include, ToListAsync vb.)
using CleanArchitecture.Core.Entities;       // Room, Reservation, MaintenanceIssue, Customer entity'leri için
using CleanArchitecture.Core.Interfaces;       // IDateTimeService için
using CleanArchitecture.Core.Exceptions;     // EntityNotFoundException için (CalculateRoomStatusDetails içinde kullanılmasa da genel olarak lazım olabilir)

// ViewModel'in namespace'ini using ile ekleyin (ViewModel'in bulunduğu yere göre ayarlayın)
using CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms
{
    // Query Sınıfı (Değişiklik Yok)
    public class GetAllRoomsQuery : IRequest<PagedResponse<GetAllRoomsViewModel>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string RoomType { get; set; }
        public int? Floor { get; set; }
        public bool? IsOnMaintenance { get; set; }
        public DateTime? AvailabilityStartDate { get; set; }
        public DateTime? AvailabilityEndDate { get; set; }
    }

    // Query Handler Sınıfı (GÜNCELLENMİŞ)
    public class GetAllRoomsQueryHandler : IRequestHandler<GetAllRoomsQuery, PagedResponse<GetAllRoomsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService;
        private static readonly TimeSpan DefaultStatusCheckTime = new TimeSpan(16, 0, 0); // Güncel durum kontrol saati (16:00 UTC idi)

        // --- Otel Saat Dilimi (Hardcoded - Daha iyisi yapılandırmadan almaktır) ---
        private const string HotelTimeZoneId = "Europe/Istanbul"; // Veya appsettings.json'dan alın
        // ---

        public GetAllRoomsQueryHandler(
            IApplicationDbContext context,
            IMapper mapper,
            IDateTimeService dateTimeService)
        {
            _context = context;
            _mapper = mapper;
            _dateTimeService = dateTimeService;
        }

        public async Task<PagedResponse<GetAllRoomsViewModel>> Handle(GetAllRoomsQuery request, CancellationToken cancellationToken)
        {
            // Durum kontrolü için checkDateTime hesaplaması (değişiklik yok)
            DateTime statusDate = request.AvailabilityStartDate?.Date ?? _dateTimeService.NowUtc.Date;
            DateTime checkDateTime = DateTime.SpecifyKind(statusDate + DefaultStatusCheckTime, DateTimeKind.Utc);

            // --- Müsaitlik Filtresi için UTC Tarihlerini Ayarlama (Değişiklik yok) ---
            DateTime? availabilityStartDateUtc = null;
            DateTime? availabilityEndDateUtc = null;
            TimeZoneInfo hotelTimeZone;

            try {
                hotelTimeZone = TimeZoneInfo.FindSystemTimeZoneById(HotelTimeZoneId);
            } catch { hotelTimeZone = TimeZoneInfo.Utc; /* Hata loglanabilir */ }


            if (request.AvailabilityStartDate.HasValue)
            {
                DateTime localStart = request.AvailabilityStartDate.Value.Date.Add(new TimeSpan(16, 0, 0)); // Yerel 16:00
                availabilityStartDateUtc = TimeZoneInfo.ConvertTimeToUtc(localStart, hotelTimeZone);
            }

            if (request.AvailabilityEndDate.HasValue)
            {
                 DateTime localEnd = request.AvailabilityEndDate.Value.Date.Add(new TimeSpan(10, 0, 0)); // Yerel 10:00
                 availabilityEndDateUtc = TimeZoneInfo.ConvertTimeToUtc(localEnd, hotelTimeZone);
            }
             // --- Müsaitlik Filtresi Tarih Ayarlama Sonu ---


            // --- VERİTABANI SORGUSU (Reservations Include basitleştirildi) ---
            var query = _context.Rooms
                .Include(r => r.Amenities)
                .Include(r => r.Reservations) // Status filtresi olmadan tümünü yükle
                    .ThenInclude(res => res.Customer)
                .Include(r => r.MaintenanceIssues)
                .AsQueryable();
            // --- VERİTABANI SORGUSU SONU ---

            // --- FİLTRELEME (Müsaitlik kısmı GÜNCELLENDİ) ---
            if (!string.IsNullOrEmpty(request.RoomType)) query = query.Where(r => r.RoomType == request.RoomType);
            if (request.Floor.HasValue) query = query.Where(r => r.Floor == request.Floor.Value);
            if (request.IsOnMaintenance.HasValue) query = query.Where(r => r.IsOnMaintenance == request.IsOnMaintenance.Value);

            // Müsaitlik filtresi (SADECE iki tarih de varsa çalışır)
            if (availabilityStartDateUtc.HasValue && availabilityEndDateUtc.HasValue)
            {
                 // Bitişin başlangıçtan sonra olduğunu kontrol et
                 if (availabilityEndDateUtc.Value <= availabilityStartDateUtc.Value)
                 {
                      throw new ValidationException("Availability End Date (at 10:00 local) must be after Availability Start Date (at 16:00 local).");
                 }

                 query = query.Where(room =>
                        // Bakım çakışması yoksa (Değişiklik yok)
                        !room.MaintenanceIssues.Any(issue =>
                            issue.Created < availabilityEndDateUtc.Value && // Assuming Created is the start
                            issue.EstimatedCompletionDate > availabilityStartDateUtc.Value) &&
                        // Rezervasyon çakışması yoksa (SADECE Aktif olanlar kontrol edilir - GÜNCELLENDİ)
                        !room.Reservations.Any(res =>
                            // Durumu "Pending" veya "Checked-in" ise VE Tarih aralığı çakışıyorsa
                            (res.Status == "Pending" || res.Status == "Checked-in") &&
                            (res.StartDate < availabilityEndDateUtc.Value && res.EndDate > availabilityStartDateUtc.Value)
                        ));
            }
            // --- FİLTRELEME SONU ---

            var totalRecords = await query.CountAsync(cancellationToken);

            var pagedData = await query
                .OrderBy(r => r.RoomNumber)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var roomViewModels = _mapper.Map<List<GetAllRoomsViewModel>>(pagedData);

// --- ViewModel Doldurma (GÜNCELLENDİ) ---
foreach (var viewModel in roomViewModels)
{
    var roomEntity = pagedData.FirstOrDefault(r => r.Id == viewModel.Id);
    if (roomEntity != null)
    {
        viewModel.Features = roomEntity.Amenities?.Select(a => a.Name).ToList() ?? new List<string>();
        // IsOnMaintenance flag'ini entity'den okuyoruz, ama computedStatus için kullanmıyoruz.
        viewModel.IsOnMaintenance = roomEntity.IsOnMaintenance;

        // Güncellenmiş CalculateRoomStatusDetails metodunu çağır
        var statusResult = CalculateRoomStatusDetails(roomEntity, checkDateTime);
        viewModel.ComputedStatus = statusResult.Status;

        // Duruma göre ilgili alanları doldur
        if (statusResult.Status == "Maintenance" && statusResult.ActiveMaintenance != null)
        {
            // Bakım durumu: Bakım detaylarını doldur, misafir bilgilerini temizle
            viewModel.MaintenanceIssueDescription = statusResult.ActiveMaintenance.IssueDescription;
            viewModel.MaintenanceCompletionDate = statusResult.ActiveMaintenance.EstimatedCompletionDate;

            viewModel.CurrentReservationId = null;
            viewModel.OccupantName = null;
            viewModel.OccupantCheckInDate = null;
            viewModel.OccupantCheckOutDate = null;
        }
        else if (statusResult.Status == "Occupied" && statusResult.OccupyingReservation != null)
        {
            // Dolu durumu: Misafir bilgilerini doldur, bakım detaylarını temizle
            var occupyingReservation = statusResult.OccupyingReservation;
            viewModel.CurrentReservationId = occupyingReservation.Id;
            viewModel.OccupantName = (occupyingReservation.Customer != null) ? $"{occupyingReservation.Customer.FirstName} {occupyingReservation.Customer.LastName}" : null;
            viewModel.OccupantCheckInDate = occupyingReservation.StartDate;
            viewModel.OccupantCheckOutDate = occupyingReservation.EndDate;

            viewModel.MaintenanceIssueDescription = null;
            viewModel.MaintenanceCompletionDate = null;
        }
        else // Status == "Available"
        {
            // Müsait durumu: Hem misafir hem bakım detaylarını temizle
            viewModel.CurrentReservationId = null;
            viewModel.OccupantName = null;
            viewModel.OccupantCheckInDate = null;
            viewModel.OccupantCheckOutDate = null;

            viewModel.MaintenanceIssueDescription = null;
            viewModel.MaintenanceCompletionDate = null;
        }
    }
}
            // --- ViewModel Doldurma Sonu ---

            return new PagedResponse<GetAllRoomsViewModel>(roomViewModels, request.PageNumber, request.PageSize, totalRecords);
            
        }
        
        private (string Status, Reservation? OccupyingReservation, MaintenanceIssue? ActiveMaintenance) CalculateRoomStatusDetails(Room room, DateTime checkDateTime)
        {
            // 1. Bakım Kontrolü: O 'checkDateTime' anında aktif bir bakım kaydı var mı?
            //    Not: MaintenanceIssues koleksiyonunun Handle metodu içinde Include ile yüklendiğini varsayıyoruz.
            var activeMaintenance = room.MaintenanceIssues? // Null check
                .FirstOrDefault(issue =>
                    // checkDateTime, bakımın başlangıcı (Created) ile bitişi (EstimatedCompletionDate) arasında mı?
                    checkDateTime >= issue.Created &&
                    checkDateTime < issue.EstimatedCompletionDate);

            if (activeMaintenance != null)
            {
                // Aktif bakım bulunduysa, durumu "Maintenance" yap ve ilgili bakım kaydını döndür.
                return ("Maintenance", null, activeMaintenance);
            }

            // 2. Rezervasyon Kontrolü: Bakımda değilse, o 'checkDateTime' anında aktif bir rezervasyon var mı?
            //    Not: Reservations koleksiyonunun Handle metodu içinde Include ile yüklendiğini varsayıyoruz.
            var conflictingReservation = room.Reservations? // Null check
                .FirstOrDefault(res =>
                    // Rezervasyon durumu "Pending" veya "Checked-in" mi? VE
                    (res.Status == "Pending" || res.Status == "Checked-in") &&
                    // checkDateTime, rezervasyonun başlangıcı ile bitişi arasında mı?
                    checkDateTime >= res.StartDate &&
                    checkDateTime < res.EndDate);

            if (conflictingReservation != null)
            {
                // Aktif rezervasyon bulunduysa, durumu "Occupied" yap ve ilgili rezervasyon kaydını döndür.
                return ("Occupied", conflictingReservation, null);
            }

            // 3. Müsait: Aktif bakım veya çakışan aktif rezervasyon yoksa oda müsaittir.
            return ("Available", null, null);
        }
    }
} // Namespace sonu