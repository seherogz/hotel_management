namespace CleanArchitecture.Core.Features.Transactions.Queries.GetTransactionSummary
{
    public class GetTransactionSummaryViewModel
    {
        public decimal DailyIncome { get; set; }
        public decimal DailyExpense { get; set; }
        public decimal WeeklyIncome { get; set; }
    }
}