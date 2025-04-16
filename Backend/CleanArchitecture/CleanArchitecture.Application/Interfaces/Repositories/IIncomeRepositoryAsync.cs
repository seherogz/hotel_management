using CleanArchitecture.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IIncomeRepositoryAsync : IGenericRepositoryAsync<Income>
    {
        Task<bool> IsUniqueIncomeNumberAsync(string incomeNumber);
        Task<IReadOnlyList<Income>> GetIncomesByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<IReadOnlyList<Income>> GetIncomesByCustomerNameAsync(string customerName);
        Task<decimal> GetDailyIncomeAsync(DateTime date);
        Task<decimal> GetWeeklyIncomeAsync(DateTime startDate);
        Task<decimal> GetMonthlyIncomeAsync(int year, int month);
    }
}