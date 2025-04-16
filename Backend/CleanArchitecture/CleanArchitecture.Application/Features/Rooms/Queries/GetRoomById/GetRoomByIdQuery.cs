using System;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById
{
    public class GetRoomByIdQuery : IRequest<GetRoomByIdViewModel>
    {
        public int Id { get; set; }
    }

    public class GetRoomByIdQueryHandler : IRequestHandler<GetRoomByIdQuery, GetRoomByIdViewModel>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IAmenityRepositoryAsync _amenityRepository;
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;
        private readonly IMapper _mapper;

        public GetRoomByIdQueryHandler(
            IRoomRepositoryAsync roomRepository,
            IAmenityRepositoryAsync amenityRepository,
            IMaintenanceIssueRepositoryAsync maintenanceIssueRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _amenityRepository = amenityRepository;
            _maintenanceIssueRepository = maintenanceIssueRepository;
            _mapper = mapper;
        }

        public async Task<GetRoomByIdViewModel> Handle(GetRoomByIdQuery request, CancellationToken cancellationToken)
        {
            // Fetch room without related data initially
            var room = await _roomRepository.GetByIdAsync(request.Id);

            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Map basic properties (AutoMapper will now ignore Features and MaintenanceDetails)
            var roomViewModel = _mapper.Map<GetRoomByIdViewModel>(room);

            // Get room amenities separately
            var amenities = await _amenityRepository.GetByRoomIdAsync(room.Id);
            // Ensure 'amenities' is not null before selecting names
            roomViewModel.Features = amenities?.Select(a => a.Name).ToList() ?? new List<string>();

            // Get maintenance issues if room is under maintenance
            // Check room status using a safer method (e.g., constants or enum) if possible
            if (room.Status != null && room.Status.Equals("on maintenance", StringComparison.OrdinalIgnoreCase))
            {
                var maintenanceIssues = await _maintenanceIssueRepository.GetByRoomIdAsync(room.Id);
                // Ensure 'maintenanceIssues' is not null before mapping
                roomViewModel.MaintenanceDetails = _mapper.Map<List<MaintenanceIssueViewModel>>(maintenanceIssues) ?? new List<MaintenanceIssueViewModel>();
            }

            return roomViewModel;
        }
    }
}