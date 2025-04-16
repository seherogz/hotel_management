using CleanArchitecture.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IAmenityRepositoryAsync : IGenericRepositoryAsync<Amenity>
    {
        Task<Amenity> GetByNameAsync(string name);
        Task<IReadOnlyList<Amenity>> GetByRoomIdAsync(int roomId);
        Task AddAmenityToRoomAsync(int roomId, int amenityId);
        Task RemoveAmenityFromRoomAsync(int roomId, int amenityId);
    }
}