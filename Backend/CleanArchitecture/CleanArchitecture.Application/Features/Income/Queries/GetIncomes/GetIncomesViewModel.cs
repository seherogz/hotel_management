using System;

namespace CleanArchitecture.Core.Features.Income.Queries.GetIncomes
{
    public class GetIncomesViewModel
    {
        public int Id { get; set; }
        public string IncomeNumber { get; set; }
        public DateTime Date { get; set; }
        public string CustomerName { get; set; }
        public string RoomNumber { get; set; }
        public decimal Amount { get; set; }
    }
}