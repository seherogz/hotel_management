using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class StaffRepositoryAsync : GenericRepositoryAsync<Staff>, IStaffRepositoryAsync
    {
        private readonly DbSet<Staff> _staff;

        public StaffRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _staff = dbContext.Set<Staff>();
        }

        public async Task<bool> IsUniqueEmailAsync(string email)
        {
            return await _staff.AllAsync(s => s.Email != email);
        }

        public async Task<bool> IsUniquePhoneNumberAsync(string phoneNumber)
        {
            return await _staff.AllAsync(s => s.PhoneNumber != phoneNumber);
        }

        public async Task<IReadOnlyList<Staff>> GetStaffByDepartmentAsync(string department)
        {
            return await _staff
                .Where(s => s.Department == department)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Staff>> GetStaffByRoleAsync(string role)
        {
            return await _staff
                .Where(s => s.Role == role)
                .ToListAsync();
        }

        public async Task<IReadOnlyList<Staff>> GetActiveStaffAsync()
        {
            return await _staff
                .Where(s => s.IsActive)
                .ToListAsync();
        }
    }
}