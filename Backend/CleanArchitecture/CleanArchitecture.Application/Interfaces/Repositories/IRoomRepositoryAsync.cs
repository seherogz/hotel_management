using CleanArchitecture.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IRoomRepositoryAsync : IGenericRepositoryAsync<Room>
    {
        Task<bool> IsUniqueRoomNumberAsync(int roomNumber);
        Task<IReadOnlyList<Room>> GetRoomsByTypeAsync(string roomType);
        Task<IReadOnlyList<Room>> GetRoomsByStatusAsync(string status);
        Task<IReadOnlyList<Room>> GetRoomsByFloorAsync(int floor);
        Task<IReadOnlyList<Room>> GetAvailableRoomsAsync(string roomType = null);
        Task<Room> GetRoomWithDetailsAsync(int id);
    }
}