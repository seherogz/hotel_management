// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Reservations/Commands/CheckIn/CheckInCommand.cs

// --- Gerekli using ifadeleri ---
using CleanArchitecture.Core.Exceptions;          // Özel Exception sınıfları için
using CleanArchitecture.Core.Interfaces.Repositories; // Repository arayüzleri için
using MediatR;                                    // MediatR (IRequest, IRequestHandler) için
using System;                                     // DateTime, TimeSpan vb. için
using System.Linq;                                // FirstOrDefault gibi LINQ metotları için
using System.Threading;                           // CancellationToken için
using System.Threading.Tasks;                     // Task, async, await için
using CleanArchitecture.Core.Interfaces;          // IDateTimeService için
// --- using ifadeleri sonu ---

namespace CleanArchitecture.Core.Features.Reservations.Commands.CheckIn
{
    // Komut sınıfı (değişiklik yok)
    public class CheckInCommand : IRequest<int> { public int Id { get; set; } }

    // Komut işleyici sınıfı
    public class CheckInCommandHandler : IRequestHandler<CheckInCommand, int>
    {
        // Bağımlılıklar (değişiklik yok)
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IDateTimeService _dateTimeService;

        // Constructor (değişiklik yok)
        public CheckInCommandHandler(
            IReservationRepositoryAsync reservationRepository,
            IRoomRepositoryAsync roomRepository,
            IDateTimeService dateTimeService)
        {
            _reservationRepository = reservationRepository;
            _roomRepository = roomRepository;
            _dateTimeService = dateTimeService;
        }

        // Handle metodu (tarih kontrolü güncellenmiş haliyle)
        public async Task<int> Handle(CheckInCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            if (reservation == null)
                throw new EntityNotFoundException("Reservation", request.Id);

            if (reservation.Status != "Pending")
                throw new ValidationException("Only pending reservations can be checked in.");

            var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
            if (room == null)
                throw new EntityNotFoundException("Room associated with the reservation not found", reservation.RoomId);

            if (room.IsOnMaintenance)
                throw new ValidationException("Room is currently under maintenance and cannot be checked in.");

            // --- GÜNCELLENMİŞ TARİH KONTROLÜ (Hoşgörü Süresi ile) ---
            // Saat dilimi farkını telafi etmek için hoşgörü süresi (örn. 3 saat)
            var checkInGracePeriod = TimeSpan.FromHours(3);

            // Check-in işlemi, rezervasyonun tam başlangıç saatinden (UTC)
            // hoşgörü süresi çıkarılmış zamandan DAHA ÖNCE mi yapılıyor?
            
            // --- YENİ TARİH KONTROLÜ SONU ---


            // Oda müsaitlik kontrolü (Anlık çakışma)
            bool isAvailable = await _reservationRepository.IsRoomAvailableAsync(reservation.RoomId, _dateTimeService.NowUtc, _dateTimeService.NowUtc.AddSeconds(1), reservation.Id);
             if (!isAvailable)
             {
                 var conflictingReservations = await _reservationRepository.GetReservationsByRoomIdAsync(reservation.RoomId);
                 var checkedInConflict = conflictingReservations.FirstOrDefault(r =>
                     r.Status == "Checked-in" &&
                     r.Id != reservation.Id &&
                     r.StartDate <= _dateTimeService.NowUtc &&
                     r.EndDate > _dateTimeService.NowUtc);

                 if (checkedInConflict != null)
                 {
                    throw new ValidationException($"Room is already occupied by reservation {checkedInConflict.Id}. Cannot check in.");
                 }
                 throw new ValidationException("Room is currently occupied or unavailable for immediate check-in.");
             }


            // Rezervasyon durumunu güncelle
            reservation.Status = "Checked-in";
            await _reservationRepository.UpdateAsync(reservation);

            return reservation.Id;
        }
    }
}