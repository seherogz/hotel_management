using System;
using System.Collections.Generic; // <-- ICollection için eklendi

namespace CleanArchitecture.Core.Entities
{
    public class Customer : AuditableBaseEntity
    {
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Status { get; set; } // VIP, Standard, etc.
        public string Nationality { get; set; }
        public string IdNumber { get; set; }
        public string Notes { get; set; }
        public DateTime BirthDate { get; set; }

        // Navigation Property: Customer'ın sahip olduğu rezervasyonlar
        public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>(); // <-- EKLENDİ
    }
}