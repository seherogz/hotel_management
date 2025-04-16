using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Staff.Commands.DeleteStaff
{
    public class DeleteStaffCommand : IRequest<int>
    {
        public int Id { get; set; }
    }

    public class DeleteStaffCommandHandler : IRequestHandler<DeleteStaffCommand, int>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IShiftRepositoryAsync _shiftRepository;

        public DeleteStaffCommandHandler(
            IStaffRepositoryAsync staffRepository,
            IShiftRepositoryAsync shiftRepository)
        {
            _staffRepository = staffRepository;
            _shiftRepository = shiftRepository;
        }

        public async Task<int> Handle(DeleteStaffCommand request, CancellationToken cancellationToken)
        {
            var staff = await _staffRepository.GetByIdAsync(request.Id);
            
            if (staff == null)
            {
                throw new EntityNotFoundException("Staff", request.Id);
            }
            
            // Check if staff has any shifts
            var staffShifts = await _shiftRepository.GetShiftsByStaffIdAsync(request.Id);
            if (staffShifts.Count > 0)
            {
                // Instead of deleting, mark as inactive
                staff.IsActive = false;
                await _staffRepository.UpdateAsync(staff);
            }
            else
            {
                // No shifts, safe to delete
                await _staffRepository.DeleteAsync(staff);
            }
            
            return staff.Id;
        }
    }
}