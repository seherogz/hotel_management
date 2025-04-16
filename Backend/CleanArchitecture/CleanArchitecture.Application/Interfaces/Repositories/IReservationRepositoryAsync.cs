using CleanArchitecture.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IReservationRepositoryAsync : IGenericRepositoryAsync<Reservation>
    {
        Task<IReadOnlyList<Reservation>> GetReservationsByCustomerIdAsync(int customerId);
        Task<IReadOnlyList<Reservation>> GetReservationsByRoomIdAsync(int roomId);
        Task<IReadOnlyList<Reservation>> GetReservationsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<IReadOnlyList<Reservation>> GetReservationsByStatusAsync(string status);
        Task<bool> IsRoomAvailableAsync(int roomId, DateTime startDate, DateTime endDate, int? excludeReservationId = null);
    }
}