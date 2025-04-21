using MediatR;

namespace CleanArchitecture.Core.Features.MaintenanceIssues.Commands.ResolveMaintenanceIssue
{
    public class ResolveMaintenanceIssueCommand : IRequest<int>
    {
        public int RoomId { get; set; }
        public int MaintenanceIssueId { get; set; }
    }
}