using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class MonthlyFinancialReportRepositoryAsync : GenericRepositoryAsync<MonthlyFinancialReport>, IMonthlyFinancialReportRepositoryAsync
    {
        private readonly DbSet<MonthlyFinancialReport> _reports;

        public MonthlyFinancialReportRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _reports = dbContext.Set<MonthlyFinancialReport>();
        }

        public async Task<MonthlyFinancialReport> GetByYearAndMonthAsync(int year, string month)
        {
            return await _reports
                .FirstOrDefaultAsync(r => r.Year == year && r.Month == month);
        }

        public async Task<IReadOnlyList<MonthlyFinancialReport>> GetByYearAsync(int year)
        {
            return await _reports
                .Where(r => r.Year == year)
                .OrderBy(r => r.Month)
                .ToListAsync();
        }

        public async Task<decimal> GetAverageOccupancyRateAsync(int year)
        {
            var reports = await _reports
                .Where(r => r.Year == year)
                .ToListAsync();
                
            if (reports.Count == 0)
            {
                return 0;
            }
            
            return reports.Average(r => r.OccupancyRate);
        }

        public async Task<decimal> GetAverageProfitMarginAsync(int year)
        {
            var reports = await _reports
                .Where(r => r.Year == year)
                .ToListAsync();
                
            if (reports.Count == 0)
            {
                return 0;
            }
            
            return reports.Average(r => r.ProfitMargin);
        }

        public async Task<MonthlyFinancialReport> GetHighestRevenueMonthAsync(int year)
        {
            return await _reports
                .Where(r => r.Year == year)
                .OrderByDescending(r => r.Revenue)
                .FirstOrDefaultAsync();
        }

        public async Task<MonthlyFinancialReport> GetLowestRevenueMonthAsync(int year)
        {
            return await _reports
                .Where(r => r.Year == year)
                .OrderBy(r => r.Revenue)
                .FirstOrDefaultAsync();
        }
    }
}