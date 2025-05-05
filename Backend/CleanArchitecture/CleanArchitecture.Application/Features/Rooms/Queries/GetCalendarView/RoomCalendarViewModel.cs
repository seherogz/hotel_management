// Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetCalendarView/RoomCalendarViewModel.cs
using System.Collections.Generic;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetCalendarView
{
    public class RoomCalendarViewModel
    {
        public int RoomId { get; set; }
        public string RoomNumber { get; set; }
        public string RoomType { get; set; }
        public string Capacity { get; set; }
        public string Description { get; set; }
        public List<string> Features { get; set; } = new List<string>();

        // --- YENİ EKLENEN ALAN ---
        public decimal PricePerNight { get; set; }
        // --- YENİ EKLENEN ALAN SONU ---

        public List<DailyStatusViewModel> DailyStatuses { get; set; } = new List<DailyStatusViewModel>();
    }
}