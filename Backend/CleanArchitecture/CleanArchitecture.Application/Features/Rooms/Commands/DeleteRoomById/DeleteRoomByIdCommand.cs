// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Commands/DeleteRoomById/DeleteRoomByIdCommand.cs
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Rooms.Commands.DeleteRoomById
{
    public class DeleteRoomByIdCommand : IRequest<int> { public int Id { get; set; } }

    public class DeleteRoomByIdCommandHandler : IRequestHandler<DeleteRoomByIdCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IDateTimeService _dateTimeService;

        public DeleteRoomByIdCommandHandler(
            IRoomRepositoryAsync roomRepository,
            IReservationRepositoryAsync reservationRepository,
            IDateTimeService dateTimeService)
        {
            _roomRepository = roomRepository;
            _reservationRepository = reservationRepository;
            _dateTimeService = dateTimeService;
        }

        public async Task<int> Handle(DeleteRoomByIdCommand request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.Id);
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Aktif veya gelecek rezervasyonları kontrol et
            var reservations = await _reservationRepository.GetReservationsByRoomIdAsync(request.Id);
            var now = _dateTimeService.NowUtc;

            // Status yerine rezervasyon durumlarına bakılıyor (bu zaten doğruydu)
            bool hasActiveOrUpcomingReservations = reservations.Any(r =>
                r.Status == "Checked-in" || // Şu an odada kalan varsa
                (r.Status == "Pending" && r.EndDate.Date >= now.Date)); // Veya gelecekte biten/başlayan bekleyen rezervasyon varsa

            if (hasActiveOrUpcomingReservations)
            {
                throw new ValidationException("Cannot delete the room: There are active or upcoming reservations associated with it.");
            }

            // İlişkili tamamlanmış/iptal edilmiş rezervasyonlar varsa ne yapılmalı?
            // Genellikle oda silinmeden önce bu rezervasyonların da temizlenmesi veya
            // odanın "silindi" olarak işaretlenmesi (soft delete) daha iyi bir pratik olabilir.
            // Şimdilik, aktif/gelecek rezervasyon yoksa siliyoruz.

            // TODO: Soft delete mekanizması eklenebilir (Room entity'sine IsDeleted alanı).
            // TODO: İlişkili eski rezervasyonların durumu değerlendirilebilir.

            await _roomRepository.DeleteAsync(room);

            return room.Id;
        }
    }
}