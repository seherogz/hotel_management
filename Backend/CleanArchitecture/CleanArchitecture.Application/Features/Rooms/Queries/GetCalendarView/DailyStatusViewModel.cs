// Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetCalendarView/DailyStatusViewModel.cs
using System;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetCalendarView
{
    public class DailyStatusViewModel
    {
        public string Date { get; set; } // "YYYY-MM-DD" formatında
        public string Status { get; set; } // "Available", "Occupied", "Maintenance"
        public int? ReservationId { get; set; }
        public string? OccupantName { get; set; }
        public string? OccupantIdNumber { get; set; } // Null olabilir
        public DateTime? ReservationStartDate { get; set; } // Null olabilir
        public DateTime? ReservationEndDate { get; set; }
        public string? MaintenanceIssueDescription { get; set; } // Null olabilir
        public DateTime? MaintenanceCompletionDate { get; set; }
    }
}