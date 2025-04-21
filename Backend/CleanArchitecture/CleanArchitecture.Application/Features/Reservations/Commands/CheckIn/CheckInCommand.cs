// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Reservations/Commands/CheckIn/CheckInCommand.cs
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Interfaces;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CheckIn
{
    public class CheckInCommand : IRequest<int> { public int Id { get; set; } }

    public class CheckInCommandHandler : IRequestHandler<CheckInCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IRoomRepositoryAsync _roomRepository; // Oda kontrolü için gerekli
        private readonly IDateTimeService _dateTimeService; // Tarih kontrolü için

        public CheckInCommandHandler(
            IReservationRepositoryAsync reservationRepository,
            IRoomRepositoryAsync roomRepository,
            IDateTimeService dateTimeService)
        {
            _reservationRepository = reservationRepository;
            _roomRepository = roomRepository;
            _dateTimeService = dateTimeService;
        }

        public async Task<int> Handle(CheckInCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            if (reservation == null)
                throw new EntityNotFoundException("Reservation", request.Id);

            if (reservation.Status != "Pending")
                throw new ValidationException("Only pending reservations can be checked in.");

            var room = await _roomRepository.GetByIdAsync(reservation.RoomId);
            if (room == null)
                throw new EntityNotFoundException("Room", reservation.RoomId); // Should not happen if DB is consistent

            if (room.IsOnMaintenance) // Bakımda ise check-in yapılamaz
                throw new ValidationException("Room is currently under maintenance and cannot be checked in.");

            // Check-in tarihi bugün veya daha önce mi?
            if (reservation.StartDate.Date > _dateTimeService.NowUtc.Date)
                throw new ValidationException("Cannot check in before the reservation start date.");

            // Odanın şu anda başka bir Checked-in misafiri var mı? (Double booking önlemi - nadir ama olabilir)
            bool isOccupied = await _reservationRepository.IsRoomAvailableAsync(reservation.RoomId, _dateTimeService.NowUtc, _dateTimeService.NowUtc.AddSeconds(1), reservation.Id);
             if (!isOccupied) // IsRoomAvailableAsync false dönerse oda müsait değil (dolu) demektir.
             {
                 // Başka bir Checked-in rezervasyon bul
                 var conflictingReservations = await _reservationRepository.GetReservationsByRoomIdAsync(reservation.RoomId);
                 var checkedInConflict = conflictingReservations.FirstOrDefault(r => r.Status == "Checked-in" && r.Id != reservation.Id && r.StartDate <= _dateTimeService.NowUtc && r.EndDate > _dateTimeService.NowUtc);
                 if (checkedInConflict != null)
                 {
                    throw new ValidationException($"Room is already occupied by reservation {checkedInConflict.Id}. Cannot check in.");
                 }
                 // Başka bir senaryo olabilir mi? Pending ama aynı güne denk gelen? IsRoomAvailableAsync bunu yakalamalı.
             }


            // Update reservation status
            reservation.Status = "Checked-in";
            await _reservationRepository.UpdateAsync(reservation);

            // Oda durumu güncellenmez.

            return reservation.Id;
        }
    }
}