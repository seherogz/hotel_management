namespace CleanArchitecture.Core.Features.FinancialReports.Queries.GetMonthlyDetails
{
    public class GetMonthlyDetailsViewModel
    {
        public string Month { get; set; }
        public decimal Revenue { get; set; }
        public decimal Expenses { get; set; }
        public decimal NetProfit { get; set; }
        public decimal ProfitMargin { get; set; }
        public decimal OccupancyRate { get; set; }
        public string Trend { get; set; }
    }
}