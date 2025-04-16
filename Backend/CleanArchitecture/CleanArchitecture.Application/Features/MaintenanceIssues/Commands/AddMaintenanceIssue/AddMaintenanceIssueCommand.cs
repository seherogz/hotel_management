using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Entities;

namespace CleanArchitecture.Core.Features.MaintenanceIssues.Commands.AddMaintenanceIssue
{
    public class AddMaintenanceIssueCommand : IRequest<int>
    {
        public int RoomId { get; set; }
        public string IssueDescription { get; set; }
        public DateTime EstimatedCompletionDate { get; set; }
    }

    public class AddMaintenanceIssueCommandHandler : IRequestHandler<AddMaintenanceIssueCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;
        private readonly IMapper _mapper;

        public AddMaintenanceIssueCommandHandler(
            IRoomRepositoryAsync roomRepository,
            IMaintenanceIssueRepositoryAsync maintenanceIssueRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _maintenanceIssueRepository = maintenanceIssueRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(AddMaintenanceIssueCommand request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }
            
            // Update room status to "on maintenance"
            room.Status = "on maintenance";
            await _roomRepository.UpdateAsync(room);
            
            // Add maintenance issue
            var maintenanceIssue = _mapper.Map<MaintenanceIssue>(request);
            await _maintenanceIssueRepository.AddAsync(maintenanceIssue);
            
            return maintenanceIssue.Id;
        }
    }
}