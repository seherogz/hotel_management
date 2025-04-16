using CleanArchitecture.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IMonthlyFinancialReportRepositoryAsync : IGenericRepositoryAsync<MonthlyFinancialReport>
    {
        Task<MonthlyFinancialReport> GetByYearAndMonthAsync(int year, string month);
        Task<IReadOnlyList<MonthlyFinancialReport>> GetByYearAsync(int year);
        Task<decimal> GetAverageOccupancyRateAsync(int year);
        Task<decimal> GetAverageProfitMarginAsync(int year);
        Task<MonthlyFinancialReport> GetHighestRevenueMonthAsync(int year);
        Task<MonthlyFinancialReport> GetLowestRevenueMonthAsync(int year);
    }
}