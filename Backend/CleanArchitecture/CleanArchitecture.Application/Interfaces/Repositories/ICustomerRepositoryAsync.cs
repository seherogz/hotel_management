using CleanArchitecture.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface ICustomerRepositoryAsync : IGenericRepositoryAsync<Customer>
    {
        Task<bool> IsUniqueEmailAsync(string email);
        Task<bool> IsUniquePhoneAsync(string phone);
        Task<Customer> GetByEmailAsync(string email);
        Task<IReadOnlyList<Customer>> GetCustomersByStatusAsync(string status);
    }
}