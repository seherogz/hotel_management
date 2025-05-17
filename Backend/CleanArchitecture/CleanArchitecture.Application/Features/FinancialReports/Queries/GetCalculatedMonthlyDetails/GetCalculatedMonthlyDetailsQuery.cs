using MediatR;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Interfaces.Repositories;

namespace CleanArchitecture.Core.Features.FinancialReports.Queries.GetCalculatedMonthlyDetails
{
    public class GetCalculatedMonthlyDetailsQuery : IRequest<List<CalculatedMonthlyDetailViewModel>>
    {
        public int Year { get; set; }
    }
    public class GetCalculatedMonthlyDetailsQueryHandler : IRequestHandler<GetCalculatedMonthlyDetailsQuery, List<CalculatedMonthlyDetailViewModel>>
    {
        private readonly IIncomeRepositoryAsync _incomeRepository;
        private readonly IExpenseRepositoryAsync _expenseRepository;

        public GetCalculatedMonthlyDetailsQueryHandler(
            IIncomeRepositoryAsync incomeRepository,
            IExpenseRepositoryAsync expenseRepository)
        {
            _incomeRepository = incomeRepository;
            _expenseRepository = expenseRepository;
        }

        public async Task<List<CalculatedMonthlyDetailViewModel>> Handle(GetCalculatedMonthlyDetailsQuery request, CancellationToken cancellationToken)
        {
            var monthlyDetails = new List<CalculatedMonthlyDetailViewModel>();
            var cultureInfo = new CultureInfo("en-US"); // Ay isimleri için Türkçe kültür

            for (int month = 1; month <= 12; month++)
            {
                decimal monthlyRevenue = await _incomeRepository.GetMonthlyIncomeAsync(request.Year, month);
                decimal monthlyExpenses = await _expenseRepository.GetMonthlyExpenseAsync(request.Year, month);
                decimal netProfit = monthlyRevenue - monthlyExpenses;
                decimal profitMargin = 0;

                if (monthlyRevenue != 0)
                {
                    profitMargin = (netProfit / monthlyRevenue) * 100;
                }

                monthlyDetails.Add(new CalculatedMonthlyDetailViewModel
                {
                    Month = cultureInfo.DateTimeFormat.GetMonthName(month),
                    MonthNumber = month,
                    Revenue = monthlyRevenue,
                    Expenses = monthlyExpenses,
                    NetProfit = netProfit,
                    ProfitMargin = profitMargin
                });
            }

            return monthlyDetails.OrderBy(m => m.MonthNumber).ToList();
        }
    }
}