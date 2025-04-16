using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.MaintenanceIssues.Queries.GetMaintenanceIssuesByRoom
{
    public class GetMaintenanceIssuesByRoomQuery : IRequest<List<GetMaintenanceIssuesByRoomViewModel>>
    {
        public int RoomId { get; set; }
    }

    public class GetMaintenanceIssuesByRoomQueryHandler : IRequestHandler<GetMaintenanceIssuesByRoomQuery, List<GetMaintenanceIssuesByRoomViewModel>>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;
        private readonly IMapper _mapper;

        public GetMaintenanceIssuesByRoomQueryHandler(
            IRoomRepositoryAsync roomRepository,
            IMaintenanceIssueRepositoryAsync maintenanceIssueRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _maintenanceIssueRepository = maintenanceIssueRepository;
            _mapper = mapper;
        }

        public async Task<List<GetMaintenanceIssuesByRoomViewModel>> Handle(GetMaintenanceIssuesByRoomQuery request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }
            
            var maintenanceIssues = await _maintenanceIssueRepository.GetByRoomIdAsync(request.RoomId);
            
            return _mapper.Map<List<GetMaintenanceIssuesByRoomViewModel>>(maintenanceIssues);
        }
    }
}