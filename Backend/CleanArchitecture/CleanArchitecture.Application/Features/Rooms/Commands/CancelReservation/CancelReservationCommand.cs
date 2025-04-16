using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Rooms.Commands.CancelReservation
{
    public class CancelReservationCommand : IRequest<bool>
    {
        public int RoomId { get; set; }
        public int ReservationId { get; set; }
    }

    public class CancelReservationCommandHandler : IRequestHandler<CancelReservationCommand, bool>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IReservationRepositoryAsync _reservationRepository;

        public CancelReservationCommandHandler(
            IRoomRepositoryAsync roomRepository,
            IReservationRepositoryAsync reservationRepository)
        {
            _roomRepository = roomRepository;
            _reservationRepository = reservationRepository;
        }

        public async Task<bool> Handle(CancelReservationCommand request, CancellationToken cancellationToken)
        {
            // Check if room exists
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null)
            {
                throw new Exception($"Room with ID {request.RoomId} not found.");
            }

            // Check if reservation exists
            var reservation = await _reservationRepository.GetByIdAsync(request.ReservationId);
            if (reservation == null)
            {
                throw new Exception($"Reservation with ID {request.ReservationId} not found.");
            }

            // Validate if reservation belongs to the room
            if (reservation.RoomId != request.RoomId)
            {
                throw new Exception("Reservation does not belong to the specified room.");
            }

            // Validate if reservation can be cancelled
            if (reservation.Status == "Completed")
            {
                throw new Exception("Cannot cancel a completed reservation.");
            }

            // Update reservation status
            reservation.Status = "Cancelled";
            await _reservationRepository.UpdateAsync(reservation);

            // Update room status if it was occupied
            if (room.Status == "occupied")
            {
                room.Status = "available";
                await _roomRepository.UpdateAsync(room);
            }
            
            return true;
        }
    }
}