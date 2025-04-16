using MediatR;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces;
using CleanArchitecture.Core.Entities;

namespace CleanArchitecture.Application.Features.Rooms.Commands
{
    public class CreateAmenityCommand : IRequest<int>
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class CreateAmenityCommandHandler : IRequestHandler<CreateAmenityCommand, int>
    {
        private readonly IApplicationDbContext _context;

        public CreateAmenityCommandHandler(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<int> Handle(CreateAmenityCommand request, CancellationToken cancellationToken)
        {
            var amenity = new Amenity
            {
                Name = request.Name,
                Description = request.Description,
                IsActive = true
            };

            _context.Amenities.Add(amenity);
            await _context.SaveChangesAsync(cancellationToken);

            return amenity.Id;
        }
    }
} 