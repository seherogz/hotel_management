// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Reservations/Commands/CheckOut/CheckOutCommand.cs
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CheckOut
{
    public class CheckOutCommand : IRequest<int> { public int Id { get; set; } }

    public class CheckOutCommandHandler : IRequestHandler<CheckOutCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        // RoomRepository'e gerek yok

        public CheckOutCommandHandler(IReservationRepositoryAsync reservationRepository)
        {
            _reservationRepository = reservationRepository;
        }

        public async Task<int> Handle(CheckOutCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            if (reservation == null)
                throw new EntityNotFoundException("Reservation", request.Id);

            if (reservation.Status != "Checked-in")
                throw new ValidationException("Only checked-in reservations can be checked out.");

            // Rezervasyon durumunu güncelle
            reservation.Status = "Completed";
            await _reservationRepository.UpdateAsync(reservation);

            // Oda durumu güncellenmez.

            return reservation.Id;
        }
    }
}