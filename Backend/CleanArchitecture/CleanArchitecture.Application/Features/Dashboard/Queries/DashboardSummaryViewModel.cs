namespace CleanArchitecture.Core.Features.Dashboard.Queries
{
    public class RoomSummaryViewModel
    {
        public int TotalRooms { get; set; }
        public int AvailableRooms { get; set; }
        public int OccupiedRooms { get; set; }
        public int RoomsUnderMaintenance { get; set; }
    }

    public class CheckInOutSummaryViewModel
    {
        public int CheckInsToday { get; set; }
        public int CheckOutsToday { get; set; }
    }

    public class RevenueSummaryViewModel
    {
        public decimal RevenueToday { get; set; }
        public decimal RevenueThisMonth { get; set; }
    }

    public class DashboardSummaryViewModel
    {
        public RoomSummaryViewModel RoomSummary { get; set; }
        public CheckInOutSummaryViewModel CheckInOutSummary { get; set; }
        public RevenueSummaryViewModel RevenueSummary { get; set; }
        public int UpcomingReservationsNext7Days { get; set; }
    }
}