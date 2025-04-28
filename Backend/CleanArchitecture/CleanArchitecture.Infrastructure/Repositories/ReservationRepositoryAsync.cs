// File: Backend/CleanArchitecture/CleanArchitecture.Infrastructure/Repositories/ReservationRepositoryAsync.cs

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
        private readonly ApplicationDbContext _dbContext; // DbContext'i private field olarak alalım

        public ReservationRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _dbContext = dbContext; // DbContext'i sakla
        }

        // Include'ları temel alan bir IQueryable oluşturalım (Tekrarlanan Include'ları önlemek için)
        private IQueryable<Reservation> ReservationsWithDetails => _dbContext.Set<Reservation>()
                                                                        .AsNoTracking() // Okuma işlemlerinde performansı artırabilir
                                                                        .Include(r => r.Customer)
                                                                        .Include(r => r.Room);

        public async Task<IReadOnlyList<Reservation>> GetReservationsByCustomerIdAsync(int customerId)
        {
            // Artık ReservationsWithDetails sorgusunu kullanıyoruz
            return await ReservationsWithDetails
                .Where(r => r.CustomerId == customerId)
                .OrderByDescending(r => r.StartDate)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Reservation>> GetReservationsByRoomIdAsync(int roomId)
        {
             // Artık ReservationsWithDetails sorgusunu kullanıyoruz
            return await ReservationsWithDetails
                .Where(r => r.RoomId == roomId)
                .OrderByDescending(r => r.StartDate)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Reservation>> GetReservationsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            // Artık ReservationsWithDetails sorgusunu kullanıyoruz
            // Sadece Pending ve Checked-in durumları dikkate alınıyor (veya ihtiyaca göre diğerleri)
            return await ReservationsWithDetails
                .Where(r =>
                    (r.StartDate <= endDate && r.EndDate >= startDate) &&
                    (r.Status == "Pending" || r.Status == "Checked-in") // Veya ihtiyaca göre diğer statuslar
                )
                .OrderBy(r => r.StartDate)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Reservation>> GetReservationsByStatusAsync(string status)
        {
            // Artık ReservationsWithDetails sorgusunu kullanıyoruz
            return await ReservationsWithDetails
                .Where(r => r.Status == status)
                .OrderBy(r => r.StartDate)
                .ToListAsync();
        }

        // Sayfalanmış sonuçları ilişkili verilerle birlikte getiren metot
        public async Task<(IReadOnlyList<Reservation> data, int totalCount)> GetPagedReservationsWithDetailsAsync(int pageNumber, int pageSize)
        {
            var query = ReservationsWithDetails; // Include'ları içeren temel sorgu
            var totalCount = await query.CountAsync(); // Toplam kayıt sayısı
            var data = await query
                .OrderByDescending(r => r.StartDate) // Veya başka bir sıralama kriteri
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            return (data, totalCount); // Hem veriyi hem toplam sayıyı döndür
        }

        // ID ile getirme için metot (ilişkili verilerle)
        public async Task<Reservation> GetReservationByIdWithDetailsAsync(int id)
        {
            // Include'ları içeren sorguyu kullanarak ID'ye göre filtrele ve ilk eşleşeni getir
            return await ReservationsWithDetails
                         .FirstOrDefaultAsync(r => r.Id == id);
        }


        // Oda müsaitlik kontrolü metodu (Durum kontrolü eklendi)
        public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime startDate, DateTime endDate, int? excludeReservationId = null)
        {
            // Bu metodun Include'a ihtiyacı yok, sadece sayım yapıyor.
            var query = _dbContext.Set<Reservation>()
                .Where(r =>
                    r.RoomId == roomId &&
                    // Sadece 'Pending' veya 'Checked-in' durumundaki rezervasyonları çakışma olarak değerlendir
                    (r.Status == "Pending" || r.Status == "Checked-in") &&
                    (r.StartDate < endDate && r.EndDate > startDate) // Tarih aralığı çakışması kontrolü
                );

            if (excludeReservationId.HasValue)
            {
                // Güncelleme sırasında mevcut rezervasyonu kontrol dışı bırakmak için
                query = query.Where(r => r.Id != excludeReservationId.Value);
            }

            // Eğer çakışan (Pending veya Checked-in) rezervasyon yoksa (Count == 0), oda müsaittir (true döner).
            int conflictingCount = await query.CountAsync();
            return conflictingCount == 0;
        }
    }
}