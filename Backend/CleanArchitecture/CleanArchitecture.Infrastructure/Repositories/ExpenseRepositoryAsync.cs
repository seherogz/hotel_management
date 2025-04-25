// File: Backend/CleanArchitecture/CleanArchitecture.Infrastructure/Repositories/ExpenseRepositoryAsync.cs
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging; // <<< ILogger için using eklendi
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class ExpenseRepositoryAsync : GenericRepositoryAsync<Expense>, IExpenseRepositoryAsync
    {
        private readonly ApplicationDbContext _dbContext; // <<< DbContext eklendi (Logger için)
        private readonly DbSet<Expense> _expenses;
        private readonly ILogger<ExpenseRepositoryAsync> _logger; // <<< Logger eklendi

        // Constructor güncellendi
        public ExpenseRepositoryAsync(ApplicationDbContext dbContext, ILogger<ExpenseRepositoryAsync> logger) : base(dbContext)
        {
            _dbContext = dbContext; // <<< Atama eklendi
            _expenses = dbContext.Set<Expense>();
            _logger = logger; // <<< Logger ataması eklendi
        }

        public async Task<bool> IsUniqueExpenseNumberAsync(string expenseNumber)
        {
            // ExpenseNumber null veya boş ise (otomatik oluşturulacaksa) kontrol etme
            if (string.IsNullOrEmpty(expenseNumber))
            {
                return true;
            }
            return await _expenses.AllAsync(e => e.ExpenseNumber != expenseNumber);
        }

        public async Task<IReadOnlyList<Expense>> GetExpensesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            // Handler'dan gelen startDate ve endDate'in UTC olduğu varsayılır.
            // Sorgu: startDate'in başlangıcından (00:00:00) endDate'in sonuna (23:59:59.999...) kadar olanları alır.
            var endOfDayEndDate = endDate.Date.AddDays(1).AddTicks(-1); // endDate gününün son anı
             _logger.LogInformation("Fetching expenses for date range: StartDateUTC={StartDate}, EndDateUTC={EndDate}",
                startDate.ToString("o"),
                endDate.ToString("o")); // endOfDayEndDate yerine orijinal endDate loglanabilir, aralık tanımı daha net.

            return await _expenses
                .Where(e => e.Date >= startDate.Date && e.Date <= endOfDayEndDate)
                .OrderByDescending(e => e.Date)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Expense>> GetExpensesByCategoryAsync(string category)
        {
             _logger.LogInformation("Fetching expenses by category: {Category}", category);
            return await _expenses
                .Where(e => e.Category == category)
                .OrderByDescending(e => e.Date)
                .ToListAsync();
        }

        public async Task<decimal> GetDailyExpenseAsync(DateTime date) // date parametresi UTC ve gün başlangıcı (00:00:00) olarak gelmeli
        {
             _logger.LogInformation("Calculating daily expense for date: DateUTC={Date}", date.ToString("o"));
            // Veritabanındaki Date (timestamptz) ile UTC gün başlangıcı karşılaştırması
            return await _expenses
                .Where(e => e.Date.Date == date.Date)
                .SumAsync(e => e.Amount);
        }

        public async Task<decimal> GetWeeklyExpenseAsync(DateTime startDate) // startDate UTC ve hafta başlangıcı (00:00:00) olarak gelmeli
        {
            var endDate = startDate.AddDays(7); // Haftanın bitişi (sonraki haftanın başlangıcı - hariç)

            // <<< Loglama Eklendi >>>
            _logger.LogInformation("Calculating weekly expense for range: StartDateUTC={StartDate}, EndDateUTC={EndDate}",
                startDate.ToString("o"), // ISO 8601 formatında logla (Kind bilgisi dahil)
                endDate.ToString("o"));

            var query = _expenses.Where(e => e.Date >= startDate && e.Date < endDate);

             // <<< Sorgu Sonrası Loglama Eklendi >>>
             try
             {
                 var weeklyTotal = await query.SumAsync(e => e.Amount);
                 _logger.LogInformation("Weekly expense calculated successfully for range [{StartDate} - {EndDate}): {TotalAmount}",
                    startDate.ToString("o"), endDate.ToString("o"), weeklyTotal);
                 return weeklyTotal;
             }
             catch (Exception ex)
             {
                 _logger.LogError(ex, "Error calculating weekly expense for range: StartDateUTC={StartDate}, EndDateUTC={EndDate}",
                     startDate.ToString("o"), endDate.ToString("o"));
                 throw; // Hatanın yukarıya fırlatılması önemli
             }
        }

        public async Task<decimal> GetMonthlyExpenseAsync(int year, int month)
        {
             _logger.LogInformation("Calculating monthly expense for: Year={Year}, Month={Month}", year, month);
            return await _expenses
                .Where(e => e.Date.Year == year && e.Date.Month == month)
                .SumAsync(e => e.Amount);
        }
    }
}