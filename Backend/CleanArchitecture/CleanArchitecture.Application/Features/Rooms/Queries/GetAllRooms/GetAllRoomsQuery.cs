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
    // Query Sınıfı (StatusCheckDate kaldırıldı)
    public class GetAllRoomsQuery : IRequest<PagedResponse<GetAllRoomsViewModel>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string RoomType { get; set; }
        public int? Floor { get; set; }
        public bool? IsOnMaintenance { get; set; } // Filtre olarak kalabilir
        public DateTime? AvailabilityStartDate { get; set; } // Hem filtre hem durum tarihi için kullanılır
        public DateTime? AvailabilityEndDate { get; set; }   // Sadece filtre için
    }

    // Query Handler Sınıfı
    public class GetAllRoomsQueryHandler : IRequestHandler<GetAllRoomsQuery, PagedResponse<GetAllRoomsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService;
        private static readonly TimeSpan DefaultStatusCheckTime = new TimeSpan(16, 0, 0); // Güncel durum kontrol saati (16:00 UTC idi)

        // --- Otel Saat Dilimi (Hardcoded - Daha iyisi yapılandırmadan almaktır) ---
        private const string HotelTimeZoneId = "Europe/Istanbul";
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

            // --- YENİ: Müsaitlik Filtresi için UTC Tarihlerini Ayarlama ---
            DateTime? availabilityStartDateUtc = null;
            DateTime? availabilityEndDateUtc = null;
            TimeZoneInfo hotelTimeZone;

            try {
                hotelTimeZone = TimeZoneInfo.FindSystemTimeZoneById(HotelTimeZoneId);
            } catch { hotelTimeZone = TimeZoneInfo.Utc; /* Hata loglanabilir */ }


            if (request.AvailabilityStartDate.HasValue)
            {
                // Başlangıç tarihi varsa: O günün 16:00'sını al (yerel) ve UTC'ye çevir
                DateTime localStart = request.AvailabilityStartDate.Value.Date.Add(new TimeSpan(16, 0, 0));
                availabilityStartDateUtc = TimeZoneInfo.ConvertTimeToUtc(localStart, hotelTimeZone);
            }

            if (request.AvailabilityEndDate.HasValue)
            {
                 // Bitiş tarihi varsa: O günün 10:00'unu al (yerel) ve UTC'ye çevir
                 DateTime localEnd = request.AvailabilityEndDate.Value.Date.Add(new TimeSpan(10, 0, 0));
                 availabilityEndDateUtc = TimeZoneInfo.ConvertTimeToUtc(localEnd, hotelTimeZone);

                 // Eğer sadece EndDate verilmişse, StartDate'i NowUtc olarak kabul edebiliriz (opsiyonel)
                 // if (!availabilityStartDateUtc.HasValue) {
                 //     availabilityStartDateUtc = _dateTimeService.NowUtc;
                 // }
            }
             // --- Müsaitlik Filtresi Tarih Ayarlama Sonu ---


            // --- VERİTABANI SORGUSU (Include'lar aynı) ---
            var query = _context.Rooms
                .Include(r => r.Amenities)
                .Include(r => r.Reservations.Where(res => res.Status == "Pending" || res.Status == "Checked-in"))
                    .ThenInclude(res => res.Customer)
                .Include(r => r.MaintenanceIssues)
                .AsQueryable();
            // --- VERİTABANI SORGUSU SONU ---

            // --- FİLTRELEME (Müsaitlik kısmı YENİ UTC sınırlarını kullanır) ---
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
                        // Bakım çakışması yoksa
                        !room.MaintenanceIssues.Any(issue =>
                            issue.Created < availabilityEndDateUtc.Value &&
                            issue.EstimatedCompletionDate > availabilityStartDateUtc.Value) &&
                        // Rezervasyon çakışması yoksa (YENİ UTC sınırlarına göre)
                        !room.Reservations.Any(res =>
                            res.StartDate < availabilityEndDateUtc.Value && // Rez. başlangıcı < Filtre Bitiş (10:00 UTC karşılığı)
                            res.EndDate > availabilityStartDateUtc.Value    // Rez. bitişi > Filtre Başlangıç (16:00 UTC karşılığı)
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

            // --- ViewModel Doldurma (StatusCheckDate kaldırılmıştı, diğerleri aynı) ---
            foreach (var viewModel in roomViewModels)
            {
                 // ... (Önceki cevapta olduğu gibi ViewModel doldurma mantığı) ...
                 var roomEntity = pagedData.FirstOrDefault(r => r.Id == viewModel.Id);
                 if (roomEntity != null)
                 {
                     viewModel.Features = roomEntity.Amenities?.Select(a => a.Name).ToList() ?? new List<string>();
                     viewModel.IsOnMaintenance = roomEntity.IsOnMaintenance;

                     var statusResult = CalculateRoomStatusDetails(roomEntity, checkDateTime); // checkDateTime hala eski mantıkla hesaplanıyor (isteğe bağlı date veya now 12:00 UTC)
                     viewModel.ComputedStatus = statusResult.Status;

                     if (statusResult.Status == "Occupied" && statusResult.OccupyingReservation != null)
                     {
                         var occupyingReservation = statusResult.OccupyingReservation;
                         viewModel.CurrentReservationId = occupyingReservation.Id;
                         viewModel.OccupantName = (occupyingReservation.Customer != null) ? $"{occupyingReservation.Customer.FirstName} {occupyingReservation.Customer.LastName}" : null;
                         viewModel.OccupantCheckInDate = occupyingReservation.StartDate;
                         viewModel.OccupantCheckOutDate = occupyingReservation.EndDate;
                     }
                     else
                     {
                         viewModel.CurrentReservationId = null;
                         viewModel.OccupantName = null;
                         viewModel.OccupantCheckInDate = null;
                         viewModel.OccupantCheckOutDate = null;
                     }
                     // StatusCheckDate ViewModel'den kaldırılmıştı.
                 }
            }
            // --- ViewModel Doldurma Sonu ---

            return new PagedResponse<GetAllRoomsViewModel>(roomViewModels, request.PageNumber, request.PageSize, totalRecords);
        }

        // Yardımcı metot (Değişiklik yok, Created tarihini kullanıyor)
        private (string Status, Reservation? OccupyingReservation, MaintenanceIssue? ActiveMaintenance) CalculateRoomStatusDetails(Room room, DateTime checkDateTime)
        {
            var activeMaintenance = room.MaintenanceIssues?
                .FirstOrDefault(issue =>
                    checkDateTime >= issue.Created &&
                    checkDateTime < issue.EstimatedCompletionDate);
            if (activeMaintenance != null) return ("Maintenance", null, activeMaintenance);

            var conflictingReservation = room.Reservations?
               .FirstOrDefault(res =>
                   checkDateTime >= res.StartDate &&
                   checkDateTime < res.EndDate);
            if (conflictingReservation != null) return ("Occupied", conflictingReservation, null);

            return ("Available", null, null);
        }
    }
} // Namespace sonu