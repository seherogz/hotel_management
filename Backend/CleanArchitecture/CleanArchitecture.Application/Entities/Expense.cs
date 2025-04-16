using System;

namespace CleanArchitecture.Core.Entities
{
    public class Expense : AuditableBaseEntity
    {
        public string ExpenseNumber { get; set; } // e.g., EXP001
        public DateTime Date { get; set; }
        public string Category { get; set; } // e.g., Personnel, Kitchen, Maintenance
        public string Description { get; set; }
        public decimal Amount { get; set; }
    }
}