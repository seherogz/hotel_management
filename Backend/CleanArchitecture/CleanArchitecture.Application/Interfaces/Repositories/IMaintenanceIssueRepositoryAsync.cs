using CleanArchitecture.Core.Entities; // <-- Doğru namespace
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    public interface IMaintenanceIssueRepositoryAsync : IGenericRepositoryAsync<MaintenanceIssue>
    {
        Task<IReadOnlyList<MaintenanceIssue>> GetByRoomIdAsync(int roomId);
    }
}