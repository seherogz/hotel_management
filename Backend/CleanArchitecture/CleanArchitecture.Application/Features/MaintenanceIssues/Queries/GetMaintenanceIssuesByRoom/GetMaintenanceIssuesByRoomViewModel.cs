using System;

namespace CleanArchitecture.Core.Features.MaintenanceIssues.Queries.GetMaintenanceIssuesByRoom
{
    public class GetMaintenanceIssuesByRoomViewModel
    {
        public int Id { get; set; }
        public int RoomId { get; set; }
        public string IssueDescription { get; set; }
        public DateTime EstimatedCompletionDate { get; set; }
    }
}