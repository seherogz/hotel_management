using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Interfaces; // IDateTimeService için eklendi

namespace CleanArchitecture.Core.Features.Transactions.Queries.GetTransactionSummary
{
    public class GetTransactionSummaryQuery : IRequest<GetTransactionSummaryViewModel>
    {
        // Tarihi nullable yapıp, controller'da Today ile doldurmak yerine
        // burada IDateTimeService ile UTC Now almak daha iyi olabilir.
        // Ya da controller'dan gelen tarihi burada UTC'ye çevirebiliriz.
        public DateTime Date { get; set; } // Controller'dan gelen tarih (Kind'ı Local veya Unspecified olabilir)
    }

    public class GetTransactionSummaryQueryHandler : IRequestHandler<GetTransactionSummaryQuery, GetTransactionSummaryViewModel>
    {
        private readonly IIncomeRepositoryAsync _incomeRepository;
        private readonly IExpenseRepositoryAsync _expenseRepository;
        private readonly IDateTimeService _dateTimeService; // Bağımlılık eklendi

        public GetTransactionSummaryQueryHandler(
            IIncomeRepositoryAsync incomeRepository,
            IExpenseRepositoryAsync expenseRepository,
            IDateTimeService dateTimeService) // Constructor'a eklendi
        {
            _incomeRepository = incomeRepository;
            _expenseRepository = expenseRepository;
            _dateTimeService = dateTimeService; // Atama yapıldı
        }

        public async Task<GetTransactionSummaryViewModel> Handle(GetTransactionSummaryQuery request, CancellationToken cancellationToken)
        {
            var dateUtc = request.Date.ToUniversalTime();
            var dateOnlyUtc = dateUtc.Date;
            
            int diff = (7 + (int)dateUtc.DayOfWeek - (int)DayOfWeek.Sunday) % 7; 
            var weekStartUtc = dateUtc.AddDays(-diff).Date;
            
            var dailyIncome = await _incomeRepository.GetDailyIncomeAsync(dateOnlyUtc);
            var dailyExpense = await _expenseRepository.GetDailyExpenseAsync(dateOnlyUtc); 
            var weeklyIncome = await _incomeRepository.GetWeeklyIncomeAsync(weekStartUtc); 
            var weeklyExpense = await _expenseRepository.GetWeeklyExpenseAsync(weekStartUtc);

            return new GetTransactionSummaryViewModel
            {
                DailyIncome = dailyIncome,
                DailyExpense = dailyExpense,
                WeeklyIncome = weeklyIncome,
                WeeklyExpense = weeklyExpense
            };
        }
    }
}