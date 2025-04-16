using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Transactions.Queries.GetTransactionSummary
{
    public class GetTransactionSummaryQuery : IRequest<GetTransactionSummaryViewModel>
    {
        public DateTime Date { get; set; } = DateTime.Today;
    }

    public class GetTransactionSummaryQueryHandler : IRequestHandler<GetTransactionSummaryQuery, GetTransactionSummaryViewModel>
    {
        private readonly IIncomeRepositoryAsync _incomeRepository;
        private readonly IExpenseRepositoryAsync _expenseRepository;

        public GetTransactionSummaryQueryHandler(
            IIncomeRepositoryAsync incomeRepository,
            IExpenseRepositoryAsync expenseRepository)
        {
            _incomeRepository = incomeRepository;
            _expenseRepository = expenseRepository;
        }

        public async Task<GetTransactionSummaryViewModel> Handle(GetTransactionSummaryQuery request, CancellationToken cancellationToken)
        {
            // Get daily income
            var dailyIncome = await _incomeRepository.GetDailyIncomeAsync(request.Date);
            
            // Get daily expense
            var dailyExpense = await _expenseRepository.GetDailyExpenseAsync(request.Date);
            
            // Get weekly income
            var weekStart = request.Date.AddDays(-(int)request.Date.DayOfWeek);
            var weeklyIncome = await _incomeRepository.GetWeeklyIncomeAsync(weekStart);
            
            return new GetTransactionSummaryViewModel
            {
                DailyIncome = dailyIncome,
                DailyExpense = dailyExpense,
                WeeklyIncome = weeklyIncome
            };
        }
    }
}