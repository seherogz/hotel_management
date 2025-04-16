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
    public class IncomeRepositoryAsync : GenericRepositoryAsync<Income>, IIncomeRepositoryAsync
    {
        private readonly DbSet<Income> _incomes;

        public IncomeRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _incomes = dbContext.Set<Income>();
        }

        public async Task<bool> IsUniqueIncomeNumberAsync(string incomeNumber)
        {
            return await _incomes.AllAsync(i => i.IncomeNumber != incomeNumber);
        }

        public async Task<IReadOnlyList<Income>> GetIncomesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _incomes
                .Where(i => i.Date >= startDate.Date && i.Date <= endDate.Date)
                .OrderByDescending(i => i.Date)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Income>> GetIncomesByCustomerNameAsync(string customerName)
        {
            return await _incomes
                .Where(i => i.CustomerName.Contains(customerName))
                .OrderByDescending(i => i.Date)
                .ToListAsync();
        }

        public async Task<decimal> GetDailyIncomeAsync(DateTime date)
        {
            return await _incomes
                .Where(i => i.Date.Date == date.Date)
                .SumAsync(i => i.Amount);
        }

        public async Task<decimal> GetWeeklyIncomeAsync(DateTime startDate)
        {
            var endDate = startDate.AddDays(7);
            return await _incomes
                .Where(i => i.Date >= startDate.Date && i.Date < endDate.Date)
                .SumAsync(i => i.Amount);
        }

        public async Task<decimal> GetMonthlyIncomeAsync(int year, int month)
        {
            return await _incomes
                .Where(i => i.Date.Year == year && i.Date.Month == month)
                .SumAsync(i => i.Amount);
        }
    }
}