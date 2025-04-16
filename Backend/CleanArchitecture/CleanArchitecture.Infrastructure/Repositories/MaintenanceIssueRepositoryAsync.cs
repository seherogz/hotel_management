using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CleanArchitecture.Core.Entities; // <-- Doğru namespace

namespace CleanArchitecture.Infrastructure.Repositories
{
    public class MaintenanceIssueRepositoryAsync : GenericRepositoryAsync<MaintenanceIssue>, IMaintenanceIssueRepositoryAsync
    {
        private readonly DbSet<MaintenanceIssue> _maintenanceIssues;

        public MaintenanceIssueRepositoryAsync(ApplicationDbContext dbContext) : base(dbContext)
        {
            _maintenanceIssues = dbContext.Set<MaintenanceIssue>();
        }

        public async Task<IReadOnlyList<MaintenanceIssue>> GetByRoomIdAsync(int roomId)
        {
            return await _maintenanceIssues
                .Where(mi => mi.RoomId == roomId)
                .ToListAsync();
        }
    }
}