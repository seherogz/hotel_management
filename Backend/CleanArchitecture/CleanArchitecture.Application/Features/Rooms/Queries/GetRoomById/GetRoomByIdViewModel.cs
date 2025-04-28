using System;
using System.Collections.Generic;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById
{
    public class GetRoomByIdViewModel
    {
        public int Id { get; set; }
        public int RoomNumber { get; set; }
        public string RoomType { get; set; }
        public int Floor { get; set; }
        public string Capacity { get; set; }
        public decimal PricePerNight { get; set; }
        public bool IsOnMaintenance { get; set; }
        public string ComputedStatus { get; set; }
        public string Description { get; set; }
        public List<string> Features { get; set; } = new List<string>();
        public List<MaintenanceIssueViewModel> MaintenanceDetails { get; set; } = new List<MaintenanceIssueViewModel>();
        public DateTime? StatusCheckDate { get; set; } // Yanıtta gidecek değer
    }

    public class MaintenanceIssueViewModel
    {
        public int Id { get; set; }
        public string IssueDescription { get; set; }
        public DateTime EstimatedCompletionDate { get; set; }
    }
}