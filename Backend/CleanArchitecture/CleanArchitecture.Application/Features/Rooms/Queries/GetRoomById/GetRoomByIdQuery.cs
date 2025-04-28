using System;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces;
using CleanArchitecture.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

// ViewModel namespace'ini ekleyin (eğer farklı bir yerdeyse)
using CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById
{
    public class GetRoomByIdQuery : IRequest<GetRoomByIdViewModel>
    {
        public int Id { get; set; }
        public DateTime? StatusCheckDate { get; set; }
    }

    public class GetRoomByIdQueryHandler : IRequestHandler<GetRoomByIdQuery, GetRoomByIdViewModel>
    {
        private readonly IApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService;
        private static readonly TimeSpan DefaultCheckTime = new TimeSpan(16, 0, 0);

        public GetRoomByIdQueryHandler(
            IApplicationDbContext context,
            IMapper mapper,
            IDateTimeService dateTimeService)
        {
             _context = context;
             _mapper = mapper;
             _dateTimeService = dateTimeService;
        }

        public async Task<GetRoomByIdViewModel> Handle(GetRoomByIdQuery request, CancellationToken cancellationToken)
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

            var room = await _context.Rooms
                .Include(r => r.Amenities)
                .Include(r => r.MaintenanceIssues)
                .Include(r => r.Reservations.Where(res => res.Status == "Pending" || res.Status == "Checked-in"))
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            var roomViewModel = _mapper.Map<GetRoomByIdViewModel>(room);

            roomViewModel.Features = room.Amenities?.Select(a => a.Name).ToList() ?? new List<string>();
            roomViewModel.MaintenanceDetails = _mapper.Map<List<MaintenanceIssueViewModel>>(room.MaintenanceIssues) ?? new List<MaintenanceIssueViewModel>();

            // *** DÜZELTME: Metodun başında hesaplanan 'checkDateTime' kullanılır ***
            roomViewModel.ComputedStatus = CalculateRoomStatus(room, checkDateTime);

            // *** DÜZELTME: Yanıtta gösterilecek zaman atanır ***
            roomViewModel.StatusCheckDate = responseStatusCheckDate;

            return roomViewModel;
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
