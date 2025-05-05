// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/MaintenanceIssues/Commands/ResolveMaintenanceIssue/ResolveMaintenanceIssueCommandHandler.cs
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.MaintenanceIssues.Commands.ResolveMaintenanceIssue
{
    public class ResolveMaintenanceIssueCommandHandler : IRequestHandler<ResolveMaintenanceIssueCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository; // Artık odayı güncellemek için kullanılmayacak
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;

        public ResolveMaintenanceIssueCommandHandler(
            IRoomRepositoryAsync roomRepository, // Bağımlılık kalabilir ama kullanılmayacak
            IMaintenanceIssueRepositoryAsync maintenanceIssueRepository)
        {
            _roomRepository = roomRepository;
            _maintenanceIssueRepository = maintenanceIssueRepository;
        }

        public async Task<int> Handle(ResolveMaintenanceIssueCommand request, CancellationToken cancellationToken)
        {
            var maintenanceIssue = await _maintenanceIssueRepository.GetByIdAsync(request.MaintenanceIssueId);
            if (maintenanceIssue == null)
            {
                throw new EntityNotFoundException("MaintenanceIssue", request.MaintenanceIssueId);
            }

            // Opsiyonel: Sorunun doğru odaya ait olup olmadığını kontrol etmek iyi bir pratik olabilir.
            if (maintenanceIssue.RoomId != request.RoomId)
            {
                 throw new ValidationException($"Maintenance issue {request.MaintenanceIssueId} does not belong to the specified room {request.RoomId}.");
            }

            // Bakım sorununu sil
            await _maintenanceIssueRepository.DeleteAsync(maintenanceIssue);

            // --- KALDIRILAN BÖLÜM ---
            // Artık başka sorun kalıp kalmadığına bakıp Room.IsOnMaintenance flag'ini değiştirmiyoruz.
            /*
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null)
            {
                // Bu durum normalde yaşanmamalı ama kontrol eklenebilir.
                throw new EntityNotFoundException("Room", request.RoomId);
            }
            var remainingIssues = await _maintenanceIssueRepository.GetByRoomIdAsync(request.RoomId);
            if (!remainingIssues.Any() && room.IsOnMaintenance)
            {
                room.IsOnMaintenance = false;
                await _roomRepository.UpdateAsync(room);
            }
            */
            // --- KALDIRILAN BÖLÜM SONU ---

            // Başarılı olursa, çözülen sorunun ait olduğu oda ID'sini döndürebiliriz.
            return request.RoomId;
        }
    }
}