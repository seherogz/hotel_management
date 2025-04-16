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
        private readonly ApplicationDbContext _dbContext; // DbContext'i burada da tutmak daha iyi olabilir
        private readonly DbSet<Room> _rooms;

        public RoomRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext; // Eklendi
            _rooms = dbContext.Set<Room>();
        }

        public async Task<IReadOnlyList<Room>> GetRoomsByTypeAsync(string roomType)
        {
            return await _rooms
                .Where(r => r.RoomType == roomType)
                .ToListAsync();
        }
        
        public async Task<IReadOnlyList<Room>> GetAvailableRoomsAsync(string roomType = null)
        {
            var query = _rooms.Where(r => r.Status == "Available");
            
            if (!string.IsNullOrEmpty(roomType))
            {
                query = query.Where(r => r.RoomType == roomType);
            }
            
            return await query.ToListAsync();
        }

        // Örnek: GetRoomsByStatusAsync (IQueryable üzerinde filtreleme)
        public async Task<IReadOnlyList<Room>> GetRoomsByStatusAsync(string status)
        {
            return await _rooms
                .Where(r => r.Status == status)
                .AsNoTracking()
                .ToListAsync();
        }

         // Örnek: GetRoomsByFloorAsync (IQueryable üzerinde filtreleme)
        public async Task<IReadOnlyList<Room>> GetRoomsByFloorAsync(int floor)
        {
            return await _rooms
                .Where(r => r.Floor == floor)
                .AsNoTracking()
                .ToListAsync();
        }

        // Örnek: GetAvailableRoomsAsync (IQueryable üzerinde filtreleme)
        public async Task<IReadOnlyList<Room>> GetAvailableRoomsAsync(DateTime startDate, DateTime endDate, string roomType = null)
        {
             // Odaları ve çakışan rezervasyonları getir
            var query = _rooms
                .Include(r => r.Reservations.Where(res =>
                    res.Status != "Cancelled" && // İptal edilmemiş
                    res.Status != "Completed" && // Tamamlanmamış
                    res.StartDate < endDate && res.EndDate > startDate)) // Tarih aralığı çakışan
                .Where(r => r.Status != "on maintenance"); // Bakımda olmayan odalar

            if (!string.IsNullOrEmpty(roomType))
            {
                query = query.Where(r => r.RoomType == roomType);
            }

            // Rezervasyonu olmayan (yani müsait) odaları seç
            var availableRooms = await query
                .Where(r => !r.Reservations.Any()) // İlişkili (çakışan) rezervasyonu olmayanlar
                .AsNoTracking()
                .ToListAsync();

            // Not: Bu sorgu "available" statüsündeki odaları da getirir ama aynı zamanda
            // belirtilen tarihlerde rezervasyonu olmayan "occupied" durumdaki odaları da
            // potansiyel olarak getirebilir (check-out tarihi startDate'den önceyse vs).
            // Sadece 'Available' statüsündekiler isteniyorsa `.Where(r => r.Status == "Available")` eklenebilir.
            // Ancak IsRoomAvailableAsync'in mantığına daha yakın bir yaklaşım bu şekildedir.

            return availableRooms;
        }


        // GetRoomWithDetailsAsync (Include'ları kontrol et)
        public async Task<Room> GetRoomWithDetailsAsync(int id)
        {
            // AsNoTracking eklenmemeli, çünkü bu oda muhtemelen güncellenecek (örn. amenity ekleme)
            return await _rooms
                .Include(r => r.Amenities)
                .Include(r => r.MaintenanceIssues)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        // IsUniqueRoomNumberAsync zaten doğru görünüyor
         public Task<bool> IsUniqueRoomNumberAsync(int roomNumber)
         {
             return _rooms.AllAsync(r => r.RoomNumber != roomNumber);
         }
    }
}