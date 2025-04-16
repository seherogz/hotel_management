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
    public class ShiftRepositoryAsync : GenericRepositoryAsync<Shift>, IShiftRepositoryAsync
    {
        private readonly DbSet<Shift> _shifts;

        public ShiftRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _shifts = dbContext.Set<Shift>();
        }

        public async Task<IReadOnlyList<Shift>> GetShiftsByStaffIdAsync(int staffId)
        {
            return await _shifts
                .Where(s => s.StaffId == staffId)
                .OrderBy(s => s.ShiftDay)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Shift>> GetShiftsByDateAsync(DateTime date)
        {
            return await _shifts
                .Where(s => s.ShiftDay.Date == date.Date)
                .Include(s => s.Staff)
                .OrderBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Shift>> GetShiftsByWeekDayAsync(string dayOfTheWeek)
        {
            return await _shifts
                .Where(s => s.DayOfTheWeek == dayOfTheWeek)
                .Include(s => s.Staff)
                .OrderBy(s => s.StartTime)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Shift>> GetShiftsByTypeAsync(string shiftType)
        {
            return await _shifts
                .Where(s => s.ShiftType == shiftType)
                .Include(s => s.Staff)
                .OrderBy(s => s.ShiftDay)
                .ThenBy(s => s.StartTime)
                .ToListAsync();
        }
    }
}