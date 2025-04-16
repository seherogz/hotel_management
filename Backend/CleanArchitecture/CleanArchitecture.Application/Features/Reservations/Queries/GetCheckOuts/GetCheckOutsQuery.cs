using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetCheckOuts
{
    public class GetCheckOutsQuery : IRequest<PagedResponse<GetCheckOutsViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public DateTime? CheckOutDate { get; set; }
        public string ReservationId { get; set; }
        public string CustomerName { get; set; }
    }

    public class GetCheckOutsQueryHandler : IRequestHandler<GetCheckOutsQuery, PagedResponse<GetCheckOutsViewModel>>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public GetCheckOutsQueryHandler(
            IReservationRepositoryAsync reservationRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetCheckOutsViewModel>> Handle(GetCheckOutsQuery request, CancellationToken cancellationToken)
        {
            // Get all checked-in reservations
            var reservations = await _reservationRepository.GetReservationsByStatusAsync("Checked-in");
            
            // Filter by check-out date if provided
            if (request.CheckOutDate.HasValue)
            {
                reservations = reservations
                    .Where(r => r.EndDate.Date == request.CheckOutDate.Value.Date)
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
            
            var checkOutsViewModels = new List<GetCheckOutsViewModel>();
            
            foreach (var reservation in pagedReservations)
            {
                var checkOut = new GetCheckOutsViewModel
                {
                    ReservationId = reservation.Id,
                    CustomerName = $"{reservation.Customer.FirstName} {reservation.Customer.LastName}",
                    RoomInfo = $"{reservation.Room.RoomNumber} ({reservation.Room.RoomType})",
                    CheckInDate = reservation.StartDate,
                    CheckOutDate = reservation.EndDate,
                    Status = reservation.Status
                };
                
                checkOutsViewModels.Add(checkOut);
            }
            
            return new PagedResponse<GetCheckOutsViewModel>(
                checkOutsViewModels, request.PageNumber, request.PageSize, reservations.Count);
        }
    }
}