namespace CleanArchitecture.Core.Features.FinancialReports.Queries.GetMonthlyFinancialReport
{
    public class GetMonthlyFinancialReportViewModel
    {
        public int Year { get; set; }
        public string Month { get; set; }
        public decimal Revenue { get; set; }
        public decimal Expenses { get; set; }
        public decimal NetProfit { get; set; }
        public decimal ProfitMargin { get; set; }
        public decimal OccupancyRate { get; set; }
        public string Trend { get; set; }
        
        // Comparison with previous year (if available)
        public decimal? PreviousYearRevenue { get; set; }
        public decimal? RevenueGrowthPercentage { get; set; }
        public decimal? PreviousYearExpenses { get; set; }
        public decimal? ExpensesGrowthPercentage { get; set; }
        public decimal? PreviousYearNetProfit { get; set; }
        public decimal? NetProfitGrowthPercentage { get; set; }
        public decimal? PreviousYearProfitMargin { get; set; }
        public decimal? ProfitMarginGrowthPercentage { get; set; }
        public decimal? PreviousYearOccupancyRate { get; set; }
        public decimal? OccupancyRateGrowthPercentage { get; set; }
    }
}