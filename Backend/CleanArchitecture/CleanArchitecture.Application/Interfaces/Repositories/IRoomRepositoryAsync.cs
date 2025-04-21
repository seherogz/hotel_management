// File: Backend/CleanArchitecture/CleanArchitecture.Application/Interfaces/Repositories/IRoomRepositoryAsync.cs
using CleanArchitecture.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IRoomRepositoryAsync : IGenericRepositoryAsync<Room>
    {
        Task<bool> IsUniqueRoomNumberAsync(int roomNumber);

        Task<IReadOnlyList<Room>> GetRoomsByTypeAsync(string roomType);

        Task<IReadOnlyList<Room>> GetRoomsByFloorAsync(int floor);
        
        Task<Room> GetRoomWithDetailsAsync(int id);
        
        Task<IReadOnlyList<Room>> GetAvailableRoomsAsync(DateTime startDate, DateTime endDate, string roomType = null);
    }
}