using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CancelReservation
{
    public class CancelReservationCommand : IRequest<int>
    {
        public int Id { get; set; }
    }

    public class CancelReservationCommandHandler : IRequestHandler<CancelReservationCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;

        public CancelReservationCommandHandler(
            IReservationRepositoryAsync reservationRepository)
        {
            _reservationRepository = reservationRepository;
        }

        public async Task<int> Handle(CancelReservationCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            
            if (reservation == null)
            {
                throw new EntityNotFoundException("Entity", request.Id);
            }

            // Check if reservation can be cancelled
            if (reservation.Status == "Completed")
            {
                throw new ValidationException("Cannot cancel a completed reservation.");
            }

            // Update the reservation status to cancelled
            reservation.Status = "Cancelled";
            await _reservationRepository.UpdateAsync(reservation);
            
            return reservation.Id;
        }
    }
}