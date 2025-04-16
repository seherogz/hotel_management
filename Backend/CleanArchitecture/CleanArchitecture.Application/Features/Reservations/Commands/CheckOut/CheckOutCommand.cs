using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CheckOut
{
    public class CheckOutCommand : IRequest<int>
    {
        public int Id { get; set; }
    }

    public class CheckOutCommandHandler : IRequestHandler<CheckOutCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IRoomRepositoryAsync _roomRepository;

        public CheckOutCommandHandler(
            IReservationRepositoryAsync reservationRepository,
            IRoomRepositoryAsync roomRepository)
        {
            _reservationRepository = reservationRepository;
            _roomRepository = roomRepository;
        }

        public async Task<int> Handle(CheckOutCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            
            if (reservation == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Validate if reservation can be checked out
            if (reservation.Status != "Checked-in")
            {
                throw new ValidationException("Only checked-in reservations can be checked out.");
            }

            // Get the room
            var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Update reservation status
            reservation.Status = "Completed";
            await _reservationRepository.UpdateAsync(reservation);

            // Update room status
            room.Status = "available";
            await _roomRepository.UpdateAsync(room);
            
            return reservation.Id;
        }
    }
}