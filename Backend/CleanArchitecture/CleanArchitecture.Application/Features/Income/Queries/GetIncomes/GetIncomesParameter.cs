using CleanArchitecture.Core.Parameters;
using System;

namespace CleanArchitecture.Core.Features.Income.Queries.GetIncomes
{
    public class GetIncomesParameter : RequestParameter
    {
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string CustomerName { get; set; }
    }
}