using CleanArchitecture.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IStaffRepositoryAsync : IGenericRepositoryAsync<Staff>
    {
        Task<bool> IsUniqueEmailAsync(string email);
        Task<bool> IsUniquePhoneNumberAsync(string phoneNumber);
        Task<IReadOnlyList<Staff>> GetStaffByDepartmentAsync(string department);
        Task<IReadOnlyList<Staff>> GetStaffByRoleAsync(string role);
        Task<IReadOnlyList<Staff>> GetActiveStaffAsync();
    }
}