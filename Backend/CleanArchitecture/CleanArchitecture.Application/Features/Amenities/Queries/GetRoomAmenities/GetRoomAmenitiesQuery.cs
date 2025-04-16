using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Amenities.Queries.GetRoomAmenities
{
    public class GetRoomAmenitiesQuery : IRequest<List<GetRoomAmenitiesViewModel>>
    {
        public int RoomId { get; set; }
    }

    public class GetRoomAmenitiesQueryHandler : IRequestHandler<GetRoomAmenitiesQuery, List<GetRoomAmenitiesViewModel>>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IAmenityRepositoryAsync _amenityRepository;
        private readonly IMapper _mapper;

        public GetRoomAmenitiesQueryHandler(
            IRoomRepositoryAsync roomRepository,
            IAmenityRepositoryAsync amenityRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _amenityRepository = amenityRepository;
            _mapper = mapper;
        }

        public async Task<List<GetRoomAmenitiesViewModel>> Handle(GetRoomAmenitiesQuery request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }
            
            var amenities = await _amenityRepository.GetByRoomIdAsync(request.RoomId);
            
            return _mapper.Map<List<GetRoomAmenitiesViewModel>>(amenities);
        }
    }
}