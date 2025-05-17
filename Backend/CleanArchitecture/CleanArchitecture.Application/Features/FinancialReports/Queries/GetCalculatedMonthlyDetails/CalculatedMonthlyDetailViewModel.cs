namespace CleanArchitecture.Core.Features.FinancialReports.Queries.GetCalculatedMonthlyDetails
{
    public class CalculatedMonthlyDetailViewModel
    {
        public string Month { get; set; } // Ocak, Şubat vb.
        public int MonthNumber { get; set; } // 1, 2 vb. (Sıralama için)
        public decimal Revenue { get; set; }
        public decimal Expenses { get; set; }
        public decimal NetProfit { get; set; }
        public decimal ProfitMargin { get; set; } // Yüzde olarak
    }
}