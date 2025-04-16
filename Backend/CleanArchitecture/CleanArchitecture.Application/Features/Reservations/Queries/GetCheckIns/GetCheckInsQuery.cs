using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetCheckIns
{
    public class GetCheckInsQuery : IRequest<PagedResponse<GetCheckInsViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public DateTime? CheckInDate { get; set; }
        public string ReservationId { get; set; }
        public string CustomerName { get; set; }
    }

    public class GetCheckInsQueryHandler : IRequestHandler<GetCheckInsQuery, PagedResponse<GetCheckInsViewModel>>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public GetCheckInsQueryHandler(
            IReservationRepositoryAsync reservationRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetCheckInsViewModel>> Handle(GetCheckInsQuery request, CancellationToken cancellationToken)
        {
            // Get all pending reservations
            var reservations = await _reservationRepository.GetReservationsByStatusAsync("Pending");
            
            // Filter by check-in date if provided
            if (request.CheckInDate.HasValue)
            {
                reservations = reservations
                    .Where(r => r.StartDate.Date == request.CheckInDate.Value.Date)
                    .ToList();
            }
            
            // Filter by reservation ID if provided
            if (!string.IsNullOrEmpty(request.ReservationId) && int.TryParse(request.ReservationId, out int reservationId))
            {
                reservations = reservations
                    .Where(r => r.Id == reservationId)
                    .ToList();
            }
            
            // Filter by customer name if provided
            if (!string.IsNullOrEmpty(request.CustomerName))
            {
                reservations = reservations
                    .Where(r => 
                        (r.Customer.FirstName + " " + r.Customer.LastName)
                        .Contains(request.CustomerName, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }
            
            // Apply paging
            var pagedReservations = reservations
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();
            
            var checkInsViewModels = new List<GetCheckInsViewModel>();
            
            foreach (var reservation in pagedReservations)
            {
                var checkIn = new GetCheckInsViewModel
                {
                    ReservationId = reservation.Id,
                    CustomerName = $"{reservation.Customer.FirstName} {reservation.Customer.LastName}",
                    RoomInfo = $"{reservation.Room.RoomNumber} ({reservation.Room.RoomType})",
                    CheckInDate = reservation.StartDate,
                    CheckOutDate = reservation.EndDate,
                    Status = reservation.Status
                };
                
                checkInsViewModels.Add(checkIn);
            }
            
            return new PagedResponse<GetCheckInsViewModel>(
                checkInsViewModels, request.PageNumber, request.PageSize, reservations.Count);
        }
    }
}