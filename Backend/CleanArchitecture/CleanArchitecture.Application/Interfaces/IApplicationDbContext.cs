using Microsoft.EntityFrameworkCore;
using CleanArchitecture.Core.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<Room> Rooms { get; set; }
        DbSet<Amenity> Amenities { get; set; }
        DbSet<MaintenanceIssue> MaintenanceIssues { get; set; }
        DbSet<Customer> Customers { get; set; }
        DbSet<Staff> Staff { get; set; }
        DbSet<Reservation> Reservations { get; set; }
        DbSet<Expense> Expenses { get; set; }
        DbSet<Income> Incomes { get; set; }
        DbSet<MonthlyFinancialReport> MonthlyFinancialReports { get; set; }
        DbSet<Shift> Shifts { get; set; }
        
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    }
}