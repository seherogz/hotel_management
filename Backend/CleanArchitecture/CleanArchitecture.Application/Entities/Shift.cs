using System;

namespace CleanArchitecture.Core.Entities
{
    public class Shift : AuditableBaseEntity
    {
        public int StaffId { get; set; }
        public Staff Staff { get; set; }
        
        public DateTime ShiftDay { get; set; }
        public string DayOfTheWeek { get; set; } // Monday, Tuesday, etc.
        public string ShiftType { get; set; } // Morning, Evening, Night
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }
}