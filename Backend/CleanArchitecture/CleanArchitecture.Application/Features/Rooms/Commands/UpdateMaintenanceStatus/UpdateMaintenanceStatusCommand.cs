using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Entities;

namespace CleanArchitecture.Core.Features.Rooms.Commands.UpdateMaintenanceStatus
{
    public class UpdateMaintenanceStatusCommand : IRequest<int>
    {
        public int RoomId { get; set; }
        public string Issue { get; set; }
        public DateTime EstimatedCompletionDate { get; set; }
    }

    public class UpdateMaintenanceStatusCommandHandler : IRequestHandler<UpdateMaintenanceStatusCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;
        private readonly IMapper _mapper;

        public UpdateMaintenanceStatusCommandHandler(
            IRoomRepositoryAsync roomRepository,
            IMaintenanceIssueRepositoryAsync maintenanceIssueRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _maintenanceIssueRepository = maintenanceIssueRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(UpdateMaintenanceStatusCommand request, CancellationToken cancellationToken)
        {
            // Check if room exists
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null)
            {
                throw new Exception($"Room with ID {request.RoomId} not found.");
            }

            // Update room status
            room.Status = "on maintenance";
            await _roomRepository.UpdateAsync(room);

            // Create maintenance issue
            var maintenanceIssue = new MaintenanceIssue
            {
                RoomId = request.RoomId,
                IssueDescription = request.Issue,
                EstimatedCompletionDate = request.EstimatedCompletionDate
            };
            
            await _maintenanceIssueRepository.AddAsync(maintenanceIssue);
            
            return maintenanceIssue.Id;
        }
    }
}