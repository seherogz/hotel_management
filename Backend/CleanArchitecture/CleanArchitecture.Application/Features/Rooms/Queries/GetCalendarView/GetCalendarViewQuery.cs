// Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetCalendarView/GetCalendarViewQuery.cs
using MediatR;
using System;
using System.Collections.Generic; // List<> için
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces; // IApplicationDbContext
using CleanArchitecture.Core.Entities;
using Microsoft.EntityFrameworkCore;
using CleanArchitecture.Core.Interfaces; 

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetCalendarView
{
    public class GetCalendarViewQuery : IRequest<List<RoomCalendarViewModel>>
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        // İleride gerekirse: public string? RoomTypeFilter { get; set; } vb. eklenebilir.
    }
    public class GetCalendarViewQueryHandler : IRequestHandler<GetCalendarViewQuery, List<RoomCalendarViewModel>>
    {
        private readonly IApplicationDbContext _context;
        private readonly IDateTimeService _dateTimeService; // Zaman işlemleri için
        // Günlük durum kontrolü için kullanılacak saat (örn: 16:00 UTC)
        private static readonly TimeSpan DailyCheckTime = new TimeSpan(16, 0, 0);

        public GetCalendarViewQueryHandler(IApplicationDbContext context, IDateTimeService dateTimeService)
        {
            _context = context;
            _dateTimeService = dateTimeService;
        }

        public async Task<List<RoomCalendarViewModel>> Handle(GetCalendarViewQuery request, CancellationToken cancellationToken)
        {
            // Tarihleri UTC'ye çevirme (Değişiklik Yok)
            var startDateUtc = DateTime.SpecifyKind(request.StartDate.Date, DateTimeKind.Utc);
            var endDateUtc = DateTime.SpecifyKind(request.EndDate.Date.AddDays(1), DateTimeKind.Utc);

            // --- ODA BİLGİLERİNİ ÇEKERKEN AMENITIES'İ INCLUDE ET (GÜNCELLENDİ) ---
            var rooms = await _context.Rooms
                .Include(r => r.Amenities) // Olanakları (Features) dahil et
                .OrderBy(r => r.RoomNumber)
                .ToListAsync(cancellationToken);
            // ---

            // İlgili rezervasyonları ve bakımları çekme (Değişiklik Yok)
            var relevantReservations = await _context.Reservations
                .Include(r => r.Customer)
                .Where(r => r.StartDate < endDateUtc
                            && r.EndDate > startDateUtc
                            && (r.Status == "Pending" || r.Status == "Checked-in"))
                .ToListAsync(cancellationToken);

            var relevantMaintenance = await _context.MaintenanceIssues
                .Where(m => m.Created < endDateUtc // Bakımın başlangıcı olarak Created varsayılıyor
                            && m.EstimatedCompletionDate > startDateUtc)
                .ToListAsync(cancellationToken);

            // Verileri gruplama (Değişiklik Yok)
            var reservationsByRoom = relevantReservations.ToLookup(r => r.RoomId);
            var maintenanceByRoom = relevantMaintenance.ToLookup(m => m.RoomId);

            var result = new List<RoomCalendarViewModel>();

            // Oda döngüsü
            foreach (var room in rooms)
            {
                // --- ROOMVIEWMODEL OLUŞTURMA (GÜNCELLENDİ - Tüm oda detayları eklendi) ---
                var roomViewModel = new RoomCalendarViewModel
                {
                    RoomId = room.Id,
                    RoomNumber = room.RoomNumber.ToString(),
                    RoomType = room.RoomType,
                    Capacity = room.Capacity,                   // EKLENDİ
                    Description = room.Description,             // EKLENDİ
                    Features = room.Amenities?.Select(a => a.Name).ToList() ?? new List<string>(), // EKLENDİ
                    PricePerNight = room.PricePerNight          // EKLENDİ
                };
                // ---

                var reservationsForThisRoom = reservationsByRoom[room.Id].ToList();
                var maintenanceForThisRoom = maintenanceByRoom[room.Id].ToList();

                // Gün döngüsü
                for (DateTime date = startDateUtc; date < endDateUtc; date = date.AddDays(1))
                {
                    // Kontrol zamanını hesapla
                    DateTime checkDateTime = date + DailyCheckTime;
                    checkDateTime = DateTime.SpecifyKind(checkDateTime, DateTimeKind.Utc);

                    var dailyStatus = new DailyStatusViewModel
                    {
                        Date = date.ToString("yyyy-MM-dd")
                    };

                    // Önce bakım kontrolü
                    var activeMaintenance = maintenanceForThisRoom
                        .FirstOrDefault(issue =>
                            checkDateTime >= issue.Created &&
                            checkDateTime < issue.EstimatedCompletionDate);

                    if (activeMaintenance != null)
                    {
                        // Bakım durumu: Bakım detaylarını doldur
                        dailyStatus.Status = "Maintenance";
                        dailyStatus.MaintenanceIssueDescription = activeMaintenance.IssueDescription; // Doldur
                        dailyStatus.MaintenanceCompletionDate = activeMaintenance.EstimatedCompletionDate; // Doldur
                        dailyStatus.ReservationId = null;
                        dailyStatus.OccupantName = null;
                        dailyStatus.ReservationStartDate = null; // Yeni alanı null yap
                        dailyStatus.ReservationEndDate = null;
                        dailyStatus.OccupantIdNumber = null; // Yeni alanı null yap
                    }
                    else // Bakımda değilse rezervasyon kontrolü yap
                    {
                        var conflictingReservation = reservationsForThisRoom
                           .FirstOrDefault(res =>
                                (res.Status == "Pending" || res.Status == "Checked-in") &&
                                checkDateTime >= res.StartDate &&
                                checkDateTime < res.EndDate);

                        if (conflictingReservation != null)
                        {
                            // Dolu durumu: Misafir bilgilerini doldur
                            dailyStatus.Status = "Occupied";
                            dailyStatus.ReservationId = conflictingReservation.Id;
                            dailyStatus.OccupantName = (conflictingReservation.Customer != null)
                                ? $"{conflictingReservation.Customer.FirstName} {conflictingReservation.Customer.LastName}"
                                : null;
                            dailyStatus.ReservationStartDate = conflictingReservation.StartDate;
                            dailyStatus.ReservationEndDate = conflictingReservation.EndDate;
                            dailyStatus.OccupantIdNumber = conflictingReservation.Customer?.IdNumber; // Yeni alanı doldur
                            dailyStatus.MaintenanceIssueDescription = null; // Temizle
                            dailyStatus.MaintenanceCompletionDate = null; // Temizle
                        }
                        else
                        {
                            // Müsait durumu: Tüm detayları temizle
                            dailyStatus.Status = "Available";
                            dailyStatus.ReservationId = null;
                            dailyStatus.OccupantName = null;
                            dailyStatus.ReservationStartDate = null; // Yeni alanı null yap
                            dailyStatus.ReservationEndDate = null; 
                            dailyStatus.OccupantIdNumber = null; // Yeni alanı null yap
                            dailyStatus.MaintenanceIssueDescription = null; // Temizle
                            dailyStatus.MaintenanceCompletionDate = null; // Temizle
                        }
                    }
                    roomViewModel.DailyStatuses.Add(dailyStatus);
                } // Gün döngüsü sonu
                result.Add(roomViewModel);
            } // Oda döngüsü sonu

            return result;
        }
    }
}