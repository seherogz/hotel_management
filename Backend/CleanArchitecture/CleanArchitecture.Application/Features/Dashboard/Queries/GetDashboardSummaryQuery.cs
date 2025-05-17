// Backend/CleanArchitecture/CleanArchitecture.Application/Features/Dashboard/Queries/GetDashboardSummaryQuery.cs
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Interfaces; // IDateTimeService için
using CleanArchitecture.Core.Interfaces.Repositories;
using Microsoft.EntityFrameworkCore; // CountAsync, SumAsync gibi EF Core metotları için
using CleanArchitecture.Application.Interfaces;

namespace CleanArchitecture.Core.Features.Dashboard.Queries
{
    public class GetDashboardSummaryQuery : IRequest<DashboardSummaryViewModel>
    {
        // Bu sorgu için genellikle parametreye ihtiyaç olmaz, çünkü "mevcut gün/ay" gibi kavramlar
        // IDateTimeService üzerinden ele alınır.
    }
    public class GetDashboardSummaryQueryHandler : IRequestHandler<GetDashboardSummaryQuery, DashboardSummaryViewModel>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IIncomeRepositoryAsync _incomeRepository;
        private readonly IDateTimeService _dateTimeService;
        private readonly IApplicationDbContext _context;

        public GetDashboardSummaryQueryHandler(
            IRoomRepositoryAsync roomRepository,
            IReservationRepositoryAsync reservationRepository,
            IIncomeRepositoryAsync incomeRepository,
            IDateTimeService dateTimeService,
            IApplicationDbContext context)
        {
            _roomRepository = roomRepository;
            _reservationRepository = reservationRepository;
            _incomeRepository = incomeRepository;
            _dateTimeService = dateTimeService;
            _context = context;
        }

        public async Task<DashboardSummaryViewModel> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
        {
            var now = _dateTimeService.NowUtc;
            var today = now.Date;
            var startOfToday = today;
            var endOfToday = today.AddDays(1).AddTicks(-1);

            // 1. Oda Özetleri
            var allRoomsQuery = _context.Rooms
                                    .Include(r => r.Reservations.Where(res =>
                                        (res.Status == "Pending" || res.Status == "Checked-in") &&
                                        now >= res.StartDate && now < res.EndDate))
                                    .Include(r => r.MaintenanceIssues.Where(mi =>
                                        now >= mi.Created && // Assuming 'Created' is the start of maintenance
                                        now < mi.EstimatedCompletionDate))
                                    .AsNoTracking();

            var allRooms = await allRoomsQuery.ToListAsync(cancellationToken);

            int totalRooms = allRooms.Count;

            // Dinamik olarak bakımdaki oda sayısını hesapla
            // Bir oda, o an aktif bir MaintenanceIssue'su varsa bakımdadır.
            // Room.IsOnMaintenance flag'ine GÜVENİLMİYOR.
            int roomsUnderMaintenance = allRooms.Count(room =>
                room.MaintenanceIssues.Any(issue =>
                    now >= issue.Created && now < issue.EstimatedCompletionDate
                )
            );

            // Dolu odalar: Mevcut anda (now) aktif bir rezervasyonu olan VE
            // o an aktif bir bakımı OLMAYAN odalar.
            int occupiedRooms = 0;
            foreach(var room in allRooms)
            {
                bool isCurrentlyUnderMaintenance = room.MaintenanceIssues.Any(issue =>
                                                    now >= issue.Created && now < issue.EstimatedCompletionDate);
                if (isCurrentlyUnderMaintenance) continue; // Bakımdaysa dolu sayılmaz (genellikle)

                bool isOccupiedNow = room.Reservations.Any(res =>
                    (res.Status == "Pending" || res.Status == "Checked-in") &&
                    now >= res.StartDate && now < res.EndDate);

                if (isOccupiedNow)
                {
                    occupiedRooms++;
                }
            }

            int availableRooms = totalRooms - occupiedRooms - roomsUnderMaintenance;
            if(availableRooms < 0) availableRooms = 0;

            var roomSummary = new RoomSummaryViewModel
            {
                TotalRooms = totalRooms,
                AvailableRooms = availableRooms,
                OccupiedRooms = occupiedRooms,
                RoomsUnderMaintenance = roomsUnderMaintenance // Dinamik hesaplanan değer
            };


            // 2. Check-in/Out Özetleri
            // Bugün başlayan ve durumu "Checked-in" olan rezervasyonlar
            int checkInsToday = await _context.Reservations
                .CountAsync(r => r.StartDate >= startOfToday && r.StartDate <= endOfToday && r.Status == "Checked-in", cancellationToken);

            int checkOutsToday = await _context.Reservations
                .CountAsync(r => r.EndDate >= startOfToday && r.EndDate <= endOfToday && r.Status == "Completed", cancellationToken);

            var checkInOutSummary = new CheckInOutSummaryViewModel
            {
                CheckInsToday = checkInsToday,
                CheckOutsToday = checkOutsToday
            };

            // 3. Gelecek 7 Günlük Rezervasyonlar
            var sevenDaysFromNow = today.AddDays(7);
            int upcomingReservationsNext7Days = await _context.Reservations
                .CountAsync(r => r.StartDate >= today && r.StartDate < sevenDaysFromNow &&
                                 (r.Status == "Pending" || r.Status == "Checked-in"), cancellationToken);

            // 4. Gelir Özetleri
            decimal revenueToday = await _incomeRepository.GetDailyIncomeAsync(today);
            decimal revenueThisMonth = await _incomeRepository.GetMonthlyIncomeAsync(today.Year, today.Month);

            var revenueSummary = new RevenueSummaryViewModel
            {
                RevenueToday = revenueToday,
                RevenueThisMonth = revenueThisMonth
            };

            return new DashboardSummaryViewModel
            {
                RoomSummary = roomSummary,
                CheckInOutSummary = checkInOutSummary,
                RevenueSummary = revenueSummary,
                UpcomingReservationsNext7Days = upcomingReservationsNext7Days
            };
        }
    }
}