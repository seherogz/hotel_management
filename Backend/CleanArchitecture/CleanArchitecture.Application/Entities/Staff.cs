using System;
using System.Collections.Generic; // <-- ICollection için eklendi

namespace CleanArchitecture.Core.Entities
{
    public class Staff : AuditableBaseEntity
    {
        // public string Name { get; set; } // <-- KALDIRILDI
        public string FirstName { get; set; }  // <-- EKLENDİ
        public string LastName { get; set; }   // <-- EKLENDİ
        public string Department { get; set; }
        public string Role { get; set; }
        public DateTime StartDate { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public decimal Salary { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation Property: Staff'ın sahip olduğu vardiyalar
        public virtual ICollection<Shift> Shifts { get; set; } = new List<Shift>(); // <-- EKLENDİ
    }
}