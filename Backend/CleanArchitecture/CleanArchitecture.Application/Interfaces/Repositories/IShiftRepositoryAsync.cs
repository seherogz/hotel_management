using CleanArchitecture.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IShiftRepositoryAsync : IGenericRepositoryAsync<Shift>
    {
        Task<IReadOnlyList<Shift>> GetShiftsByStaffIdAsync(int staffId);
        Task<IReadOnlyList<Shift>> GetShiftsByDateAsync(DateTime date);
        Task<IReadOnlyList<Shift>> GetShiftsByWeekDayAsync(string dayOfTheWeek);
        Task<IReadOnlyList<Shift>> GetShiftsByTypeAsync(string shiftType);
    }
}