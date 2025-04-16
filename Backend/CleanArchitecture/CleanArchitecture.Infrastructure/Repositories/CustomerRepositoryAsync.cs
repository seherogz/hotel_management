using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class CustomerRepositoryAsync : GenericRepositoryAsync<Customer>, ICustomerRepositoryAsync
    {
        private readonly DbSet<Customer> _customers;

        public CustomerRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _customers = dbContext.Set<Customer>();
        }

        public async Task<bool> IsUniqueEmailAsync(string email)
        {
            return await _customers.AllAsync(c => c.Email != email);
        }

        public async Task<bool> IsUniquePhoneAsync(string phone)
        {
            return await _customers.AllAsync(c => c.Phone != phone);
        }

        public async Task<Customer> GetByEmailAsync(string email)
        {
            return await _customers
                .FirstOrDefaultAsync(c => c.Email == email);
        }

        public async Task<IReadOnlyList<Customer>> GetCustomersByStatusAsync(string status)
        {
            return await _customers
                .Where(c => c.Status == status)
                .ToListAsync();
        }
    }
}