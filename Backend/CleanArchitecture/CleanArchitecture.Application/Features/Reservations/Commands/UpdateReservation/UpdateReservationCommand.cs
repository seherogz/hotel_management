using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Commands.UpdateReservation
{
    public class UpdateReservationCommand : IRequest<int>
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int RoomId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int NumberOfGuests { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; }
        public int? Rating { get; set; }
    }

    public class UpdateReservationCommandHandler : IRequestHandler<UpdateReservationCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMapper _mapper;

        public UpdateReservationCommandHandler(
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

        public async Task<int> Handle(UpdateReservationCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            
            if (reservation == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Validate customer exists
            var customer = await _customerRepository.GetByIdAsync(request.Id);
            if (customer == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Validate room exists
            var room = await _roomRepository.GetByIdAsync(request.Id);
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // If room or dates are changing, check availability
            if (reservation.RoomId != request.Id ||
                reservation.StartDate != request.StartDate ||
                reservation.EndDate != request.EndDate)
            {
                var isRoomAvailable = await _reservationRepository.IsRoomAvailableAsync(
                    request.Id, request.StartDate, request.EndDate, request.Id);
                
                if (!isRoomAvailable)
                {
                    throw new ValidationException("Room is not available for the selected dates.");
                }
            }

            // Update the reservation
            reservation.CustomerId = request.Id;
            reservation.RoomId = request.Id;
            reservation.StartDate = request.StartDate;
            reservation.EndDate = request.EndDate;
            reservation.NumberOfGuests = request.NumberOfGuests;
            reservation.Price = request.Price;
            reservation.Status = request.Status;
            reservation.Rating = request.Rating;

            await _reservationRepository.UpdateAsync(reservation);
            
            return reservation.Id;
        }
    }
}