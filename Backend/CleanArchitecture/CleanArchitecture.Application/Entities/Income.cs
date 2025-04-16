using System;

namespace CleanArchitecture.Core.Entities
{
    public class Income : AuditableBaseEntity
    {
        public string IncomeNumber { get; set; } // e.g., IN001
        public DateTime Date { get; set; }
        public string CustomerName { get; set; }
        public string RoomNumber { get; set; }
        public decimal Amount { get; set; }
    }
}