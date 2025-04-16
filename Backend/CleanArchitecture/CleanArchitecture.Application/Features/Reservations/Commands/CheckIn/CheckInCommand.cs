using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CheckIn
{
    public class CheckInCommand : IRequest<int>
    {
        public int Id { get; set; }
    }

    public class CheckInCommandHandler : IRequestHandler<CheckInCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IRoomRepositoryAsync _roomRepository;

        public CheckInCommandHandler(
            IReservationRepositoryAsync reservationRepository,
            IRoomRepositoryAsync roomRepository)
        {
            _reservationRepository = reservationRepository;
            _roomRepository = roomRepository;
        }

        public async Task<int> Handle(CheckInCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            
            if (reservation == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Validate if reservation can be checked in
            if (reservation.Status != "Pending")
            {
                throw new ValidationException("Only pending reservations can be checked in.");
            }

            // Check if room is available
            var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            if (room.Status != "available")
            {
                throw new ValidationException("Room is not available for check-in.");
            }

            // Update reservation status
            reservation.Status = "Checked-in";
            await _reservationRepository.UpdateAsync(reservation);

            // Update room status
            room.Status = "occupied";
            await _roomRepository.UpdateAsync(room);
            
            return reservation.Id;
        }
    }
}