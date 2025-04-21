using System;

namespace CleanArchitecture.Core.Entities
{
    public class Reservation : AuditableBaseEntity
    {
        public int CustomerId { get; set; }
        public Customer Customer { get; set; }
        
        public int RoomId { get; set; }
        public Room Room { get; set; }
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int NumberOfGuests { get; set; }
        public decimal Price { get; set; }
        public int? Rating { get; set; }
        public string Status { get; set; } // Checked-in, Pending, Completed, Cancelled
    }
}