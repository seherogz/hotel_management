using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Entities;

namespace CleanArchitecture.Core.Features.Amenities.Commands.AddAmenityToRoom
{
    public class AddAmenityToRoomCommand : IRequest<bool>
    {
        public int RoomId { get; set; }
        public List<string> AmenityNames { get; set; }
    }

    public class AddAmenityToRoomCommandHandler : IRequestHandler<AddAmenityToRoomCommand, bool>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IAmenityRepositoryAsync _amenityRepository;

        public AddAmenityToRoomCommandHandler(
            IRoomRepositoryAsync roomRepository,
            IAmenityRepositoryAsync amenityRepository)
        {
            _roomRepository = roomRepository;
            _amenityRepository = amenityRepository;
        }

        public async Task<bool> Handle(AddAmenityToRoomCommand request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }

            foreach (var amenityName in request.AmenityNames)
            {
                // Get or create amenity
                var amenity = await _amenityRepository.GetByNameAsync(amenityName);
                if (amenity == null)
                {
                    amenity = new Amenity { Name = amenityName, IsActive = true };
                    await _amenityRepository.AddAsync(amenity);
                }

                // Add amenity to room
                await _amenityRepository.AddAmenityToRoomAsync(room.Id, amenity.Id);
            }

            return true;
        }
    }
}