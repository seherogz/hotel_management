using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Features.Rooms.DTOs;
using CleanArchitecture.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CleanArchitecture.Application.Features.Rooms.Queries
{
    public class GetAmenitiesQuery : IRequest<List<AmenityDto>>
    {
        public bool? IsActive { get; set; }
    }

    public class GetAmenitiesQueryHandler : IRequestHandler<GetAmenitiesQuery, List<AmenityDto>>
    {
        private readonly IApplicationDbContext _context;

        public GetAmenitiesQueryHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<AmenityDto>> Handle(GetAmenitiesQuery request, CancellationToken cancellationToken)
        {
            var query = _context.Amenities.AsQueryable();

            if (request.IsActive.HasValue)
            {
                query = query.Where(a => a.IsActive == request.IsActive.Value);
            }

            return await query
                .Select(a => new AmenityDto
                {
                    Id = a.Id,
                    Name = a.Name,
                    Description = a.Description,
                    IsActive = a.IsActive
                })
                .ToListAsync(cancellationToken);
        }
    }
} 