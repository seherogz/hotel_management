using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation
{
    public class CreateReservationCommand : IRequest<int>
    {
        public int CustomerId { get; set; }
        public int RoomId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int NumberOfGuests { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; } = "Pending";
    }

    public class CreateReservationCommandHandler : IRequestHandler<CreateReservationCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMapper _mapper;

        public CreateReservationCommandHandler(
            IReservationRepositoryAsync reservationRepository,
            ICustomerRepositoryAsync customerRepository,
            IRoomRepositoryAsync roomRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _customerRepository = customerRepository;
            _roomRepository = roomRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
        {
            // Validate customer exists
            var customer = await _customerRepository.GetByIdAsync(request.CustomerId);
            if (customer == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }

            // Validate room exists
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }

            // Check room availability for the requested dates
            var isRoomAvailable = await _reservationRepository.IsRoomAvailableAsync(
                request.RoomId, request.StartDate, request.EndDate);
            
            if (!isRoomAvailable)
            {
                throw new ValidationException("Room is not available for the selected dates.");
            }

            // Create the reservation
            var reservation = _mapper.Map<Reservation>(request);
            await _reservationRepository.AddAsync(reservation);
            
            return reservation.Id;
        }
    }
}