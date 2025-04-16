using System;

namespace CleanArchitecture.Core.Entities
{
    public class MaintenanceIssue : AuditableBaseEntity
    {
        public int RoomId { get; set; }
        public Room Room { get; set; }
        
        public string IssueDescription { get; set; }
        public DateTime EstimatedCompletionDate { get; set; }
    }
}