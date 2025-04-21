using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Entities;

namespace CleanArchitecture.Core.Features.Rooms.Commands.UpdateRoom
{
    public class UpdateRoomCommand : IRequest<int>
    {
        [Required]
        public int Id { get; set; } // ID route'dan alınmalı, command içinde de olabilir.
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
        public bool IsOnMaintenance { get; set; } // Bakım durumu API'dan güncellenebilir mi? Evet.
    }

    public class UpdateRoomCommandHandler : IRequestHandler<UpdateRoomCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IAmenityRepositoryAsync _amenityRepository;
        private readonly IMapper _mapper;

        public UpdateRoomCommandHandler(
            IRoomRepositoryAsync roomRepository, 
            IAmenityRepositoryAsync amenityRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _amenityRepository = amenityRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(UpdateRoomCommand request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.Id);
            
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Update room properties
            room.RoomNumber = request.RoomNumber;
            room.RoomType = request.RoomType;
            room.Floor = request.Floor;
            room.Capacity = request.RoomCapacity; // Change from RoomCapacity to Capacity
            room.PricePerNight = request.PricePerNight;
            room.Description = request.Description;

            await _roomRepository.UpdateAsync(room);

            // Update room amenities
            if (request.Features != null)
            {
                // Get current amenities
                var currentAmenities = await _amenityRepository.GetByRoomIdAsync(room.Id);
                
                // Remove current amenities
                foreach (var amenity in currentAmenities)
                {
                    await _amenityRepository.RemoveAmenityFromRoomAsync(room.Id, amenity.Id);
                }

                // Add new amenities
                foreach (var feature in request.Features)
                {
                    // Get or create amenity
                    var amenity = await _amenityRepository.GetByNameAsync(feature);
                    if (amenity == null)
                    {
                        amenity = new Amenity { Name = feature, IsActive = true };
                        await _amenityRepository.AddAsync(amenity);
                    }

                    // Add amenity to room
                    await _amenityRepository.AddAmenityToRoomAsync(room.Id, amenity.Id);
                }
            }

            return room.Id;
        }
    }
}