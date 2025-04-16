
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAvailableRooms
{
    public class GetAvailableRoomsQuery : IRequest<PagedResponse<GetAvailableRoomsViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string RoomType { get; set; }
        public string Status { get; set; }
        public string[] Features { get; set; }
    }

    public class GetAvailableRoomsQueryHandler : IRequestHandler<GetAvailableRoomsQuery, PagedResponse<GetAvailableRoomsViewModel>>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IAmenityRepositoryAsync _amenityRepository;
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public GetAvailableRoomsQueryHandler(
            IRoomRepositoryAsync roomRepository,
            IAmenityRepositoryAsync amenityRepository,
            IMaintenanceIssueRepositoryAsync maintenanceIssueRepository,
            IReservationRepositoryAsync reservationRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _amenityRepository = amenityRepository;
            _maintenanceIssueRepository = maintenanceIssueRepository;
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetAvailableRoomsViewModel>> Handle(GetAvailableRoomsQuery request, CancellationToken cancellationToken)
        {
            // Get all rooms
            var rooms = await _roomRepository.GetPagedReponseAsync(request.PageNumber, request.PageSize);
            
            // Filter by room type if provided
            if (!string.IsNullOrEmpty(request.RoomType))
            {
                rooms = rooms.Where(r => r.RoomType == request.RoomType).ToList();
            }
            
            // Filter by status if provided
            if (!string.IsNullOrEmpty(request.Status))
            {
                rooms = rooms.Where(r => r.Status == request.Status).ToList();
            }
            
            var availableRoomsViewModel = new List<GetAvailableRoomsViewModel>();
            
            foreach (var room in rooms)
            {
                // Check if room is available for the date range
                var isAvailable = await _reservationRepository.IsRoomAvailableAsync(
                    room.Id, request.StartDate, request.EndDate);
                
                // Skip if filtering for available rooms and room is not available
                if (request.Status == "available" && !isAvailable && room.Status != "available")
                {
                    continue;
                }
                
                var roomViewModel = new GetAvailableRoomsViewModel
                {
                    Id = room.Id,
                    RoomNumber = room.RoomNumber,
                    Status = room.Status,
                    Capacity = room.Capacity,
                    PricePerNight = room.PricePerNight
                };
                
                // Get amenities
                var amenities = await _amenityRepository.GetByRoomIdAsync(room.Id);
                roomViewModel.Features = amenities.Select(a => a.Name).ToList();
                
                // Filter by features if provided
                if (request.Features != null && request.Features.Length > 0)
                {
                    bool hasAllFeatures = true;
                    foreach (var feature in request.Features)
                    {
                        if (!roomViewModel.Features.Contains(feature))
                        {
                            hasAllFeatures = false;
                            break;
                        }
                    }
                    
                    if (!hasAllFeatures)
                    {
                        continue;
                    }
                }
                
                // Get guest info if room is occupied
                if (room.Status == "occupied")
                {
                    var reservation = (await _reservationRepository.GetReservationsByRoomIdAsync(room.Id))
                        .FirstOrDefault(r => r.Status == "Checked-in");
                    
                    if (reservation != null)
                    {
                        roomViewModel.GuestInfo = new GuestInfoViewModel
                        {
                            GuestName = $"{reservation.Customer.FirstName} {reservation.Customer.LastName}",
                            CheckInDate = reservation.StartDate.ToString("yyyy-MM-dd"),
                            CheckOutDate = reservation.EndDate.ToString("yyyy-MM-dd")
                        };
                    }
                }
                
                // Get maintenance details if room is under maintenance
                if (room.Status == "on maintenance")
                {
                    var maintenanceIssue = (await _maintenanceIssueRepository.GetByRoomIdAsync(room.Id))
                        .FirstOrDefault();
                    
                    if (maintenanceIssue != null)
                    {
                        roomViewModel.MaintenanceDetails = new MaintenanceDetailsViewModel
                        {
                            Issue = maintenanceIssue.IssueDescription,
                            EstimatedCompletionDate = maintenanceIssue.EstimatedCompletionDate.ToString("yyyy-MM-dd") ?? "N/A"
                        };
                    }
                }
                
                availableRoomsViewModel.Add(roomViewModel);
            }
            
            return new PagedResponse<GetAvailableRoomsViewModel>(
                availableRoomsViewModel, request.PageNumber, request.PageSize, rooms.Count);
        }
    }
}