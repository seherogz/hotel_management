using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class ReservationRepositoryAsync : GenericRepositoryAsync<Reservation>, IReservationRepositoryAsync
    {
        private readonly DbSet<Reservation> _reservations;

        public ReservationRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _reservations = dbContext.Set<Reservation>();
        }

        public async Task<IReadOnlyList<Reservation>> GetReservationsByCustomerIdAsync(int customerId)
        {
            return await _reservations
                .Where(r => r.CustomerId == customerId)
                .Include(r => r.Room)
                .OrderByDescending(r => r.StartDate)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Reservation>> GetReservationsByRoomIdAsync(int roomId)
        {
            return await _reservations
                .Where(r => r.RoomId == roomId)
                .Include(r => r.Customer)
                .OrderByDescending(r => r.StartDate)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Reservation>> GetReservationsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _reservations
                .Where(r => 
                    (r.StartDate <= endDate && r.EndDate >= startDate) && 
                    (r.Status == "Pending" || r.Status == "Checked-in")
                )
                .Include(r => r.Room)
                .Include(r => r.Customer)
                .OrderBy(r => r.StartDate)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Reservation>> GetReservationsByStatusAsync(string status)
        {
            return await _reservations
                .Where(r => r.Status == status)
                .Include(r => r.Room)
                .Include(r => r.Customer)
                .OrderBy(r => r.StartDate)
                .ToListAsync();
        }

        public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime startDate, DateTime endDate, int? excludeReservationId = null)
        {
            var query = _reservations
                .Where(r => 
                    r.RoomId == roomId && 
                    (r.Status == "Pending" || r.Status == "Checked-in") &&
                    (r.StartDate < endDate && r.EndDate > startDate)
                );

            if (excludeReservationId.HasValue)
            {
                query = query.Where(r => r.Id != excludeReservationId.Value);
            }

            return await query.CountAsync() == 0;
        }
    }
}