using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class AmenityRepositoryAsync : GenericRepositoryAsync<Amenity>, IAmenityRepositoryAsync
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly DbSet<Amenity> _amenities;
        
        public AmenityRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _amenities = _dbContext.Set<Amenity>();
        }

        public async Task<Amenity> GetByNameAsync(string name)
        {
            return await _amenities
                .FirstOrDefaultAsync(a => a.Name == name);
        }

        public async Task<IReadOnlyList<Amenity>> GetByRoomIdAsync(int roomId)
        {
            var room = await _dbContext.Rooms
                .Include(r => r.Amenities)
                .FirstOrDefaultAsync(r => r.Id == roomId);
                
            return room?.Amenities.ToList() ?? new List<Amenity>();
        }

        public async Task AddAmenityToRoomAsync(int roomId, int amenityId)
        {
            var room = await _dbContext.Rooms
                .Include(r => r.Amenities)
                .FirstOrDefaultAsync(r => r.Id == roomId);
                
            var amenity = await _amenities.FindAsync(amenityId);
            
            if (room != null && amenity != null)
            {
                if (room.Amenities == null)
                    room.Amenities = new List<Amenity>();
                
                room.Amenities.Add(amenity);
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task RemoveAmenityFromRoomAsync(int roomId, int amenityId)
        {
            var room = await _dbContext.Rooms
                .Include(r => r.Amenities)
                .FirstOrDefaultAsync(r => r.Id == roomId);
                
            var amenity = await _amenities.FindAsync(amenityId);
            
            if (room != null && amenity != null && room.Amenities != null)
            {
                room.Amenities.Remove(amenity);
                await _dbContext.SaveChangesAsync();
            }
        }
    }
}