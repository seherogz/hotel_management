// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Reservations/Commands/CancelReservation/CancelReservationCommand.cs
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CancelReservation // Namespace düzeltildi
{
    public class CancelReservationCommand : IRequest<int> // Geriye ID döndürelim
    {
        public int Id { get; set; } // Sadece rezervasyon ID'si yeterli
        // public int RoomId { get; set; } // Oda ID'si gereksiz, rezervasyondan alınabilir
    }

    public class CancelReservationCommandHandler : IRequestHandler<CancelReservationCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        // RoomRepository'e gerek yok

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
                throw new EntityNotFoundException("Reservation", request.Id);
            }

            // Rezervasyon zaten iptal edilmiş veya tamamlanmış mı kontrolü
            if (reservation.Status == "Cancelled" || reservation.Status == "Completed")
            {
                // Hata fırlatmak yerine belki sadece ID döndürülebilir veya işlem yapılmaz.
                // Şimdilik hata fırlatalım.
                throw new ValidationException($"Reservation is already {reservation.Status} and cannot be cancelled again.");
            }

            // İptal edilebilir diğer durumlar (Pending, Checked-in)
            // Not: Checked-in bir rezervasyonun iptali farklı iş kurallarına tabi olabilir (örn. ceza).
            // Şimdilik basitçe iptal ediyoruz.

            // Rezervasyon durumunu güncelle
            reservation.Status = "Cancelled";
            await _reservationRepository.UpdateAsync(reservation);

            // Oda durumu güncellenmez.

            return reservation.Id;
        }
    }
}