using System.Collections.Generic;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAvailableRooms
{
    public class GetAvailableRoomsViewModel
    {
        public int Id { get; set; }
        public int RoomNumber { get; set; }
        public string Status { get; set; }
        public string Capacity { get; set; }
        public decimal PricePerNight { get; set; }
        public List<string> Features { get; set; } = new List<string>();
        public GuestInfoViewModel GuestInfo { get; set; }
        public MaintenanceDetailsViewModel MaintenanceDetails { get; set; }
    }

    public class GuestInfoViewModel
    {
        public string GuestName { get; set; }
        public string CheckInDate { get; set; }
        public string CheckOutDate { get; set; }
    }

    public class MaintenanceDetailsViewModel
    {
        public string Issue { get; set; }
        public string EstimatedCompletionDate { get; set; }
    }
}