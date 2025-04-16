using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class ExpenseRepositoryAsync : GenericRepositoryAsync<Expense>, IExpenseRepositoryAsync
    {
        private readonly DbSet<Expense> _expenses;

        public ExpenseRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _expenses = dbContext.Set<Expense>();
        }

        public async Task<bool> IsUniqueExpenseNumberAsync(string expenseNumber)
        {
            return await _expenses.AllAsync(e => e.ExpenseNumber != expenseNumber);
        }

        public async Task<IReadOnlyList<Expense>> GetExpensesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _expenses
                .Where(e => e.Date >= startDate.Date && e.Date <= endDate.Date)
                .OrderByDescending(e => e.Date)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Expense>> GetExpensesByCategoryAsync(string category)
        {
            return await _expenses
                .Where(e => e.Category == category)
                .OrderByDescending(e => e.Date)
                .ToListAsync();
        }

        public async Task<decimal> GetDailyExpenseAsync(DateTime date)
        {
            return await _expenses
                .Where(e => e.Date.Date == date.Date)
                .SumAsync(e => e.Amount);
        }

        public async Task<decimal> GetWeeklyExpenseAsync(DateTime startDate)
        {
            var endDate = startDate.AddDays(7);
            return await _expenses
                .Where(e => e.Date >= startDate.Date && e.Date < endDate.Date)
                .SumAsync(e => e.Amount);
        }

        public async Task<decimal> GetMonthlyExpenseAsync(int year, int month)
        {
            return await _expenses
                .Where(e => e.Date.Year == year && e.Date.Month == month)
                .SumAsync(e => e.Amount);
        }
    }
}