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
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;

        public ResolveMaintenanceIssueCommandHandler(
            IRoomRepositoryAsync roomRepository,
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

            if (maintenanceIssue.RoomId != request.RoomId)
            {
                throw new ValidationException("Maintenance issue does not belong to the specified room.");
            }

            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }

            // Bakım sorununu sil
            await _maintenanceIssueRepository.DeleteAsync(maintenanceIssue);

            // Oda için başka aktif bakım sorunu kalıp kalmadığını kontrol et
            // Silinen issue hariç diğerlerini kontrol et
            var remainingIssues = await _maintenanceIssueRepository.GetByRoomIdAsync(request.RoomId);

            // Eğer başka issue kalmadıysa ve oda bakımda ise, bakım durumunu kaldır
            if (!remainingIssues.Any() && room.IsOnMaintenance) // <<< GÜNCELLENDİ
            {
                room.IsOnMaintenance = false; // <<< GÜNCELLENDİ
                await _roomRepository.UpdateAsync(room);
            }

            return request.RoomId;
        }
    }
}