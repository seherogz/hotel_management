using CleanArchitecture.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IExpenseRepositoryAsync : IGenericRepositoryAsync<Expense>
    {
        Task<bool> IsUniqueExpenseNumberAsync(string expenseNumber);
        Task<IReadOnlyList<Expense>> GetExpensesByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<IReadOnlyList<Expense>> GetExpensesByCategoryAsync(string category);
        Task<decimal> GetDailyExpenseAsync(DateTime date);
        Task<decimal> GetWeeklyExpenseAsync(DateTime startDate);
        Task<decimal> GetMonthlyExpenseAsync(int year, int month);
    }
}