// File: Backend/CleanArchitecture/CleanArchitecture.Infrastructure/Repositories/RoomRepositoryAsync.cs
using System;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class RoomRepositoryAsync : GenericRepositoryAsync<Room>, IRoomRepositoryAsync
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly DbSet<Room> _rooms;

        public RoomRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext;
            _rooms = dbContext.Set<Room>();
        }

        public async Task<IReadOnlyList<Room>> GetRoomsByTypeAsync(string roomType)
        {
            return await _rooms
                .Where(r => r.RoomType == roomType)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Room>> GetRoomsByFloorAsync(int floor)
        {
            return await _rooms
                .Where(r => r.Floor == floor)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Room>> GetAvailableRoomsAsync(DateTime startDate, DateTime endDate, string roomType = null)
        {
             // Odaları ve çakışan rezervasyonları getir
            var query = _rooms
                .Include(r => r.Reservations.Where(res =>
                    (res.Status == "Pending" || res.Status == "Checked-in") && // Sadece aktif veya bekleyen rezervasyonlar
                    res.StartDate < endDate && res.EndDate > startDate)) // Tarih aralığı çakışanlar
                .Where(r => !r.IsOnMaintenance); // Bakımda olmayan odalar

            if (!string.IsNullOrEmpty(roomType))
            {
                query = query.Where(r => r.RoomType == roomType);
            }

            // Rezervasyonu olmayan (yani müsait) odaları seç
            var availableRooms = await query
                .Where(r => !r.Reservations.Any()) // İlişkili (çakışan) rezervasyonu olmayanlar
                .AsNoTracking()
                .ToListAsync();

            return availableRooms;
        }

        // GetRoomWithDetailsAsync: Rezervasyonları da içerecek şekilde güncellendi
        public async Task<Room> GetRoomWithDetailsAsync(int id)
        {
            // Oda detayı sorgulanırken veya güncellenirken ilişkili tüm veriler gerekebilir.
            // Durum hesaplama için rezervasyonlar da dahil edildi.
            return await _rooms
                .Include(r => r.Amenities)
                .Include(r => r.MaintenanceIssues)
                .Include(r => r.Reservations.Where(res => res.Status == "Pending" || res.Status == "Checked-in")) // Aktif rezervasyonlar
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public Task<bool> IsUniqueRoomNumberAsync(int roomNumber)
        {
             // Ensure unique index in DB handles this primarily, but check can remain.
             return _rooms.AllAsync(r => r.RoomNumber != roomNumber);
        }

    }
}