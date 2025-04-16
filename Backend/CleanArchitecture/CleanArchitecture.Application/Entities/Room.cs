using System.Collections.Generic;

namespace CleanArchitecture.Core.Entities
{
    public class Room : AuditableBaseEntity
    {
        public int RoomNumber { get; set; }
        public string RoomType { get; set; }
        public int Floor { get; set; }
        public string Capacity { get; set; }
        public string Status { get; set; }
        public decimal PricePerNight { get; set; }
        public string Description { get; set; }
        
        // Navigation properties
        public virtual ICollection<MaintenanceIssue> MaintenanceIssues { get; set; } = new List<MaintenanceIssue>();
        public virtual ICollection<Amenity> Amenities { get; set; } = new List<Amenity>();
        public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}