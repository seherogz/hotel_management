using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetAllReservations
{
    public class GetAllReservationsQuery : IRequest<PagedResponse<GetAllReservationsViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public string Status { get; set; }
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        public int? CustomerId { get; set; }
        public int? RoomId { get; set; }
    }

    public class GetAllReservationsQueryHandler : IRequestHandler<GetAllReservationsQuery, PagedResponse<GetAllReservationsViewModel>>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public GetAllReservationsQueryHandler(
            IReservationRepositoryAsync reservationRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetAllReservationsViewModel>> Handle(GetAllReservationsQuery request, CancellationToken cancellationToken)
        {
            IReadOnlyList<Entities.Reservation> reservations;
            
            // Apply filters
            if (request.CheckInDate.HasValue && request.CheckOutDate.HasValue)
            {
                // Get reservations for a specific date range
                reservations = await _reservationRepository.GetReservationsByDateRangeAsync(
                    request.CheckInDate.Value, request.CheckOutDate.Value);
            }
            else if (!string.IsNullOrEmpty(request.Status))
            {
                // Get reservations by status
                reservations = await _reservationRepository.GetReservationsByStatusAsync(request.Status);
            }
            else if (request.CustomerId.HasValue)
            {
                // Get reservations for a specific customer
                reservations = await _reservationRepository.GetReservationsByCustomerIdAsync(request.CustomerId.Value);
            }
            else if (request.RoomId.HasValue)
            {
                // Get reservations for a specific room
                reservations = await _reservationRepository.GetReservationsByRoomIdAsync(request.RoomId.Value);
            }
            else
            {
                // Get all reservations (paged)
                reservations = await _reservationRepository.GetPagedReponseAsync(request.PageNumber, request.PageSize);
            }
            
            // Apply paging if specific filters weren't applied
            var pagedReservations = reservations
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();
            
            var reservationViewModels = _mapper.Map<List<GetAllReservationsViewModel>>(pagedReservations);
            
            // Set customer names
            foreach (var reservationViewModel in reservationViewModels)
            {
                var reservation = pagedReservations.FirstOrDefault(r => r.Id == reservationViewModel.Id);
                if (reservation?.Customer != null)
                {
                    reservationViewModel.CustomerName = $"{reservation.Customer.FirstName} {reservation.Customer.LastName}";
                }
                
                if (reservation?.Room != null)
                {
                    reservationViewModel.RoomNumber = reservation.Room.RoomNumber;
                    reservationViewModel.RoomType = reservation.Room.RoomType;
                }
            }
            
            return new PagedResponse<GetAllReservationsViewModel>(
                reservationViewModels, request.PageNumber, request.PageSize, reservations.Count);
        }
    }
}