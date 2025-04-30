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
        // Günlük durum kontrolü için kullanılacak saat (örn: öğlen 12:00 UTC)
        private static readonly TimeSpan DailyCheckTime = new TimeSpan(16, 0, 0);

        public GetCalendarViewQueryHandler(IApplicationDbContext context, IDateTimeService dateTimeService)
        {
            _context = context;
            _dateTimeService = dateTimeService;
        }

        public async Task<List<RoomCalendarViewModel>> Handle(GetCalendarViewQuery request, CancellationToken cancellationToken)
        {
            // --- DÜZELTME: Tarihleri alırken türünü UTC olarak belirt ---
            var startDateUtc = DateTime.SpecifyKind(request.StartDate.Date, DateTimeKind.Utc); // Türü UTC yap
            var endDateUtc = DateTime.SpecifyKind(request.EndDate.Date.AddDays(1), DateTimeKind.Utc); // Türü UTC yap
            // --- DÜZELTME SONU ---


            // --- Sorgular artık UTC türünde tarihlerle çalışacak ---
            var rooms = await _context.Rooms
                .OrderBy(r => r.RoomNumber)
                .ToListAsync(cancellationToken);

            var relevantReservations = await _context.Reservations
                .Include(r => r.Customer)
                .Where(r => r.StartDate < endDateUtc // Artık UTC
                            && r.EndDate > startDateUtc   // Artık UTC
                            && (r.Status == "Pending" || r.Status == "Checked-in"))
                .ToListAsync(cancellationToken);

            var relevantMaintenance = await _context.MaintenanceIssues
                .Where(m => m.Created < endDateUtc // Artık UTC
                            && m.EstimatedCompletionDate > startDateUtc) // Artık UTC
                .ToListAsync(cancellationToken); 

            // Hızlı erişim için verileri oda ID'sine göre grupla
            var reservationsByRoom = relevantReservations.ToLookup(r => r.RoomId);
            var maintenanceByRoom = relevantMaintenance.ToLookup(m => m.RoomId);

            // 2. Sonuç listesini oluştur
            var result = new List<RoomCalendarViewModel>();

            // 3. Her bir oda için işlem yap
            foreach (var room in rooms)
            {
                var roomViewModel = new RoomCalendarViewModel
                {
                    RoomId = room.Id,
                    RoomNumber = room.RoomNumber.ToString(), // Varsa ToString()
                    RoomType = room.RoomType
                };

                var reservationsForThisRoom = reservationsByRoom[room.Id].ToList();
                var maintenanceForThisRoom = maintenanceByRoom[room.Id].ToList();

                // 4. İstenen tarih aralığındaki her bir gün için işlem yap
                for (DateTime date = startDateUtc; date < endDateUtc; date = date.AddDays(1))
                {
                    // O günün durumunu kontrol etmek için kullanılacak zaman noktası (örn: öğlen 12:00 UTC)
                    DateTime checkDateTime = date + DailyCheckTime; // Tarih + 12:00
                    checkDateTime = DateTime.SpecifyKind(checkDateTime, DateTimeKind.Utc); // Türünü belirt

                    var dailyStatus = new DailyStatusViewModel
                    {
                        Date = date.ToString("yyyy-MM-dd") // Sadece tarih formatı
                    };

                    // Durumu hesapla (önce bakım, sonra rezervasyon)
                    var activeMaintenance = maintenanceForThisRoom
                        .FirstOrDefault(issue =>
                            checkDateTime >= issue.Created &&
                            checkDateTime < issue.EstimatedCompletionDate);

                    if (activeMaintenance != null)
                    {
                        dailyStatus.Status = "Maintenance";
                        // dailyStatus.MaintenanceDescription = activeMaintenance.IssueDescription; // İsteğe bağlı
                    }
                    else
                    {
                        var conflictingReservation = reservationsForThisRoom
                           .FirstOrDefault(res =>
                               checkDateTime >= res.StartDate &&
                               checkDateTime < res.EndDate);

                        if (conflictingReservation != null)
                        {
                            dailyStatus.Status = "Occupied";
                            dailyStatus.ReservationId = conflictingReservation.Id;
                            dailyStatus.OccupantName = (conflictingReservation.Customer != null)
                                ? $"{conflictingReservation.Customer.FirstName} {conflictingReservation.Customer.LastName}"
                                : null;
                        }
                        else
                        {
                            dailyStatus.Status = "Available";
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