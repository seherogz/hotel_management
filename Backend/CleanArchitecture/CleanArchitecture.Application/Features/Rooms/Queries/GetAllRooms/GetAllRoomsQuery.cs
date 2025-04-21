// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetAllRooms/GetAllRoomsQuery.cs
using System;
using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories; // IRoomRepositoryAsync için
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces; // IApplicationDbContext, IDateTimeService için
using Microsoft.EntityFrameworkCore;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms
{
    // Query Sınıfı
    public class GetAllRoomsQuery : IRequest<PagedResponse<GetAllRoomsViewModel>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string RoomType { get; set; }
        public int? Floor { get; set; }
        public bool? IsOnMaintenance { get; set; } // <<< EKLENDİ (Eğer yoksa)
        public DateTime? AvailabilityStartDate { get; set; }
        public DateTime? AvailabilityEndDate { get; set; }
        public DateTime? StatusCheckDate { get; set; } // <<< EKLENDİ (Eğer yoksa)
    }

    // Query Handler Sınıfı
    public class GetAllRoomsQueryHandler : IRequestHandler<GetAllRoomsQuery, PagedResponse<GetAllRoomsViewModel>>
    {
        private readonly IApplicationDbContext _context; 
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService;

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
            // <<<< BAŞLANGIÇ: UTC Dönüşümü >>>>
            // Sorguda kullanılacak nullable tarihleri UTC'ye çevir
            DateTime? availabilityStartDateUtc = request.AvailabilityStartDate.HasValue 
                ? DateTime.SpecifyKind(request.AvailabilityStartDate.Value, DateTimeKind.Utc) 
                : (DateTime?)null;
            DateTime? availabilityEndDateUtc = request.AvailabilityEndDate.HasValue 
                ? DateTime.SpecifyKind(request.AvailabilityEndDate.Value, DateTimeKind.Utc) 
                : (DateTime?)null;
            DateTime? statusCheckDateUtc = request.StatusCheckDate.HasValue
                ? DateTime.SpecifyKind(request.StatusCheckDate.Value, DateTimeKind.Utc)
                : (DateTime?)null;

            // Eğer gelen tarihlerin yerel saat olduğunu varsayıyorsanız .ToUniversalTime() kullanın:
            // DateTime? availabilityStartDateUtc = request.AvailabilityStartDate?.ToUniversalTime();
            // DateTime? availabilityEndDateUtc = request.AvailabilityEndDate?.ToUniversalTime();
            // DateTime? statusCheckDateUtc = request.StatusCheckDate?.ToUniversalTime();
            // <<<< BİTİŞ: UTC Dönüşümü >>>>


            var query = _context.Rooms
                .Include(r => r.Amenities)
                .Include(r => r.Reservations.Where(res => res.Status == "Pending" || res.Status == "Checked-in"))
                .AsQueryable();

            // Filtreleme (Değişiklik yok, query değişkeni zaten var)
            if (!string.IsNullOrEmpty(request.RoomType))
            {
                query = query.Where(r => r.RoomType == request.RoomType);
            }
            if (request.Floor.HasValue)
            {
                query = query.Where(r => r.Floor == request.Floor.Value);
            }
            if (request.IsOnMaintenance.HasValue)
            {
                 query = query.Where(r => r.IsOnMaintenance == request.IsOnMaintenance.Value);
            }

            // Müsaitlik tarih aralığına göre filtrele (UTC değerleri kullanarak)
            if (availabilityStartDateUtc.HasValue && availabilityEndDateUtc.HasValue)
            {
                // <<<< Değişiklik: UTC değerleri kullan >>>>
                var startDate = availabilityStartDateUtc.Value; 
                var endDate = availabilityEndDateUtc.Value;

                query = query.Where(room =>
                        !room.IsOnMaintenance &&
                        !room.Reservations.Any(res =>
                            res.StartDate < endDate && 
                            res.EndDate > startDate    
                        ));
            }

            // Hata burada oluşuyordu, çünkü filtrelemede kullanılan parametreler Unspecified Kind sahipti.
            // Artık filtreleme UTC ile yapıldığı için CountAsync sorun çıkarmamalı.
            var totalRecords = await query.CountAsync(cancellationToken); // <<< Hatanın oluştuğu yer burası veya altındaki ToListAsync idi

            var pagedData = await query
                .OrderBy(r => r.RoomNumber) 
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .AsNoTracking() 
                .ToListAsync(cancellationToken);

            var roomViewModels = _mapper.Map<List<GetAllRoomsViewModel>>(pagedData);

            // Durum hesaplama tarihi (UTC veya NowUtc kullan)
            var statusCheckDate = statusCheckDateUtc?.Date ?? _dateTimeService.NowUtc.Date; // <<< statusCheckDateUtc kullanıldı

            foreach (var viewModel in roomViewModels)
            {
                var roomEntity = pagedData.FirstOrDefault(r => r.Id == viewModel.Id);
                if (roomEntity != null)
                {
                    viewModel.Features = roomEntity.Amenities?.Select(a => a.Name).ToList() ?? new List<string>();
                    viewModel.IsOnMaintenance = roomEntity.IsOnMaintenance;
                    viewModel.ComputedStatus = CalculateRoomStatus(roomEntity, statusCheckDate); // statusCheckDate zaten UTC tabanlı
                    viewModel.StatusCheckDate = statusCheckDate; // ViewModel'a atanan tarih de UTC tabanlı
                }
            }

            return new PagedResponse<GetAllRoomsViewModel>(roomViewModels, request.PageNumber, request.PageSize, totalRecords);
        }

        // ... (CalculateRoomStatus metodu - değişiklik gerekmez, aldığı tarih zaten UTC tabanlı olmalı) ...
        private string CalculateRoomStatus(Room room, DateTime checkDate) // checkDate'in UTC olduğu varsayılır
        {
             if (room.IsOnMaintenance)
            {
                return "Maintenance";
            }

            var relevantReservation = room.Reservations
                .FirstOrDefault(res =>
                    res.StartDate.Date <= checkDate && // Veritabanındaki tarihler de UTC olmalı
                    res.EndDate.Date > checkDate);     // Veritabanındaki tarihler de UTC olmalı

            if (relevantReservation != null)
            {
                 if (relevantReservation.Status == "Checked-in")
                 {
                      return "Occupied";
                 }
            }
            return "Available";
        }
    }
}