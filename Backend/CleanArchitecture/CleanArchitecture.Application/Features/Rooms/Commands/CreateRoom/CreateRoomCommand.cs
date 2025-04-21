using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Entities;
using MediatR;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using System.ComponentModel.DataAnnotations;

namespace CleanArchitecture.Core.Features.Rooms.Commands.CreateRoom
{
    public class CreateRoomCommand : IRequest<int>
    {
        [Required]
        public int RoomNumber { get; set; }
        [Required]
        [MaxLength(50)]
        public string RoomType { get; set; }
        [Required]
        public int Floor { get; set; }
        [Required]
        [MaxLength(20)]
        public string RoomCapacity { get; set; }
        // Status yok
        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal PricePerNight { get; set; }
        [MaxLength(500)]
        public string Description { get; set; }
        public List<string> Features { get; set; } = new List<string>();
    }

    public class CreateRoomCommandHandler : IRequestHandler<CreateRoomCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IAmenityRepositoryAsync _amenityRepository;
        private readonly IMapper _mapper;

        public CreateRoomCommandHandler(
            IRoomRepositoryAsync roomRepository, 
            IAmenityRepositoryAsync amenityRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _amenityRepository = amenityRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(CreateRoomCommand request, CancellationToken cancellationToken)
        {
            var room = _mapper.Map<Room>(request);
            
            // Set auditable properties
            room.Created = DateTime.UtcNow;
            room.CreatedBy = "System"; // This should come from the current user
            
            // Add room to database
            await _roomRepository.AddAsync(room);

            // Add amenities to the room
            if (request.Features != null && request.Features.Count > 0)
            {
                foreach (var feature in request.Features)
                {
                    // Get or create amenity
                    var amenity = await _amenityRepository.GetByNameAsync(feature);
                    if (amenity == null)
                    {
                        amenity = new Amenity { Name = feature, IsActive = true };
                        await _amenityRepository.AddAsync(amenity);
                    }

                    // Add amenity to room by retrieving the room with its relationships
                    var roomWithDetails = await _roomRepository.GetRoomWithDetailsAsync(room.Id);
                    if (roomWithDetails != null)
                    {
                        roomWithDetails.Amenities.Add(amenity);
                        await _roomRepository.UpdateAsync(roomWithDetails);
                    }
                }
            }

            return room.Id;
        }
    }
}