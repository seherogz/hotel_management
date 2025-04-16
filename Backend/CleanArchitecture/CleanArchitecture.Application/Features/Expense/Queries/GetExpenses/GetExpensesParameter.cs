using CleanArchitecture.Core.Parameters;
using System;

namespace CleanArchitecture.Core.Features.Expense.Queries.GetExpenses
{
    public class GetExpensesParameter : RequestParameter
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Category { get; set; }
    }
}