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
        // Not: Okuma işlemlerinde AsNoTracking() performansı artırır.
        private IQueryable<Reservation> ReservationsWithDetails => _dbContext.Set<Reservation>()
                                                                        .AsNoTracking()
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
            // Include içeren sorguyu burada tekrar tanımlayalım ki AsNoTracking() olmadan toplam sayı alınabilsin
             var queryBase = _dbContext.Set<Reservation>()
                                        .Include(r => r.Customer)
                                        .Include(r => r.Room);

            var totalCount = await queryBase.CountAsync(); // Toplam kayıt sayısı

            var data = await queryBase
                .OrderByDescending(r => r.StartDate) // Veya başka bir sıralama kriteri
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking() // Veriyi çekerken AsNoTracking kullanabiliriz
                .ToListAsync();
            return (data, totalCount); // Hem veriyi hem toplam sayıyı döndür
        }

        // ID ile getirme için metot (ilişkili verilerle)
        public async Task<Reservation> GetReservationByIdWithDetailsAsync(int id)
        {
            // Include'ları içeren sorguyu kullanarak ID'ye göre filtrele ve ilk eşleşeni getir
            // AsNoTracking burada kullanılmamalı çünkü entity üzerinde değişiklik yapılabilir.
            return await _dbContext.Set<Reservation>()
                         .Include(r => r.Customer)
                         .Include(r => r.Room)
                         .FirstOrDefaultAsync(r => r.Id == id);
        }


        // Oda müsaitlik kontrolü metodu (Hem Bakım hem Rezervasyon kontrolü eklendi - GÜNCELLENDİ)
        public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime startDate, DateTime endDate, int? excludeReservationId = null)
        {
            // 1. Bakım Kontrolü: Belirtilen tarih aralığında aktif bir bakım var mı?
            //    Not: MaintenanceIssue.Created tarihini başlangıç olarak varsayıyoruz.
            bool hasMaintenanceConflict = await _dbContext.Set<MaintenanceIssue>()
                .AnyAsync(m =>
                    m.RoomId == roomId &&
                    m.Created < endDate && // Bakım başlangıcı < istenen bitiş
                    m.EstimatedCompletionDate > startDate // Bakım bitişi > istenen başlangıç
                );

            if (hasMaintenanceConflict)
            {
                // Eğer bakım çakışması varsa, oda müsait değildir.
                return false;
            }

            // 2. Rezervasyon Kontrolü: Belirtilen tarih aralığında aktif bir rezervasyon var mı?
            var reservationQuery = _dbContext.Set<Reservation>()
                .Where(r =>
                    r.RoomId == roomId &&
                    // Sadece 'Pending' veya 'Checked-in' durumundaki rezervasyonları çakışma olarak değerlendir
                    (r.Status == "Pending" || r.Status == "Checked-in") &&
                    (r.StartDate < endDate && r.EndDate > startDate) // Tarih aralığı çakışması kontrolü
                );

            if (excludeReservationId.HasValue)
            {
                // Güncelleme sırasında mevcut rezervasyonu kontrol dışı bırakmak için
                reservationQuery = reservationQuery.Where(r => r.Id != excludeReservationId.Value);
            }

            // Eğer çakışan (Pending veya Checked-in) rezervasyon yoksa (Count == 0), oda müsaittir.
            int conflictingReservationCount = await reservationQuery.CountAsync();
            bool isAvailable = conflictingReservationCount == 0;

            return isAvailable; // Bakım çakışması yoksa ve rezervasyon çakışması yoksa true döner.
        }
    }
}