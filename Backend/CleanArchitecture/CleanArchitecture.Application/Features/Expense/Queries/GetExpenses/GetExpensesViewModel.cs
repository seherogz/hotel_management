using System;

namespace CleanArchitecture.Core.Features.Expense.Queries.GetExpenses
{
    public class GetExpensesViewModel
    {
        public int Id { get; set; }
        public string ExpenseNumber { get; set; }
        public DateTime Date { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public decimal Amount { get; set; }
    }
}