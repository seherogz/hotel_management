using System;

namespace CleanArchitecture.Core.Entities
{
    public class MonthlyFinancialReport : AuditableBaseEntity
    {
        public int Year { get; set; }
        public string Month { get; set; } // e.g., January, February, etc.
        public decimal Revenue { get; set; }
        public decimal Expenses { get; set; }
        public decimal NetProfit { get; set; }
        public decimal ProfitMargin { get; set; }
        public decimal OccupancyRate { get; set; }
        public string Trend { get; set; } // "up", "down", "neutral"
    }
}