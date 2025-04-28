// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetAllRooms/GetAllRoomsQuery.cs
using System;
using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces;
using Microsoft.EntityFrameworkCore;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms
{
    public class GetAllRoomsQuery : IRequest<PagedResponse<GetAllRoomsViewModel>>
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string RoomType { get; set; }
        public int? Floor { get; set; }
        public bool? IsOnMaintenance { get; set; }
        public DateTime? AvailabilityStartDate { get; set; }
        public DateTime? AvailabilityEndDate { get; set; }
        public DateTime? StatusCheckDate { get; set; }
    }

    public class GetAllRoomsQueryHandler : IRequestHandler<GetAllRoomsQuery, PagedResponse<GetAllRoomsViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService;
        private static readonly TimeSpan DefaultCheckTime = new TimeSpan(16, 0, 0);

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
            // --- checkDateTime HESAPLAMASI (Metodun başında) ---
            DateTime checkDateTime; // Durum hesaplaması için kullanılacak ZAMAN
            if (request.StatusCheckDate.HasValue)
            {
                var requestedDate = request.StatusCheckDate.Value;
                checkDateTime = (requestedDate.TimeOfDay == TimeSpan.Zero)
                    ? requestedDate.Date + DefaultCheckTime
                    : requestedDate;

                if (checkDateTime.Kind == DateTimeKind.Unspecified) checkDateTime = DateTime.SpecifyKind(checkDateTime, DateTimeKind.Utc);
                else if (checkDateTime.Kind == DateTimeKind.Local) checkDateTime = checkDateTime.ToUniversalTime();
            }
            else
            {
                checkDateTime = _dateTimeService.NowUtc;
            }
            // --- checkDateTime HESAPLAMASI SONU ---

            // --- Yanıtta gösterilecek zaman (Her zaman 13:00 UTC) ---
            DateTime responseStatusCheckDate = DateTime.SpecifyKind(
                _dateTimeService.NowUtc.Date + new TimeSpan(19, 0, 0),
                DateTimeKind.Utc
            );
            // --- Yanıtta gösterilecek zaman SONU ---


            DateTime? availabilityStartDateUtc = request.AvailabilityStartDate?.ToUniversalTime();
            DateTime? availabilityEndDateUtc = request.AvailabilityEndDate?.ToUniversalTime();

            var query = _context.Rooms
                .Include(r => r.Amenities)
                .Include(r => r.Reservations.Where(res => res.Status == "Pending" || res.Status == "Checked-in"))
                .ThenInclude(res => res.Customer)
                .AsQueryable();

            // Filtreleme
            if (!string.IsNullOrEmpty(request.RoomType)) query = query.Where(r => r.RoomType == request.RoomType);
            if (request.Floor.HasValue) query = query.Where(r => r.Floor == request.Floor.Value);
            if (request.IsOnMaintenance.HasValue) query = query.Where(r => r.IsOnMaintenance == request.IsOnMaintenance.Value);
            if (availabilityStartDateUtc.HasValue && availabilityEndDateUtc.HasValue)
            {
                 query = query.Where(room =>
                        !room.IsOnMaintenance &&
                        !room.Reservations.Any(res =>
                            res.StartDate < availabilityEndDateUtc.Value &&
                            res.EndDate > availabilityStartDateUtc.Value
                        ));
            }

            var totalRecords = await query.CountAsync(cancellationToken);

            var pagedData = await query
                .OrderBy(r => r.RoomNumber)
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .AsNoTracking()
                .ToListAsync(cancellationToken);

            var roomViewModels = _mapper.Map<List<GetAllRoomsViewModel>>(pagedData);

            // ViewModel'leri Doldurma
            foreach (var viewModel in roomViewModels)
            {
                var roomEntity = pagedData.FirstOrDefault(r => r.Id == viewModel.Id);
                if (roomEntity != null)
                {
                    viewModel.Features = roomEntity.Amenities?.Select(a => a.Name).ToList() ?? new List<string>();
                    viewModel.IsOnMaintenance = roomEntity.IsOnMaintenance;
                    // *** DÜZELTME: Döngü dışında hesaplanan 'checkDateTime' kullanılır ***
                    viewModel.ComputedStatus = CalculateRoomStatus(roomEntity, checkDateTime);
                    // *** DÜZELTME: Yanıtta gösterilecek zaman atanır ***
                    viewModel.StatusCheckDate = responseStatusCheckDate;
                }
            }

            return new PagedResponse<GetAllRoomsViewModel>(roomViewModels, request.PageNumber, request.PageSize, totalRecords);
        }

        // CalculateRoomStatus metodu (değişiklik yok)
        private string CalculateRoomStatus(Room room, DateTime checkDateTime)
        {
             if (room.IsOnMaintenance) return "Maintenance";

             var conflictingReservation = room.Reservations?
                .FirstOrDefault(res =>
                    checkDateTime >= res.StartDate &&
                    checkDateTime < res.EndDate);

             return (conflictingReservation != null) ? "Occupied" : "Available";
        }
    }
}