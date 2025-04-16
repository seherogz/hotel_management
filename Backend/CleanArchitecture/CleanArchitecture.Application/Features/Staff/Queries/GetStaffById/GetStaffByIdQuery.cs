using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Staff.Queries.GetStaffById
{
    public class GetStaffByIdQuery : IRequest<GetStaffByIdViewModel>
    {
        public int Id { get; set; }
    }

    public class GetStaffByIdQueryHandler : IRequestHandler<GetStaffByIdQuery, GetStaffByIdViewModel>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IShiftRepositoryAsync _shiftRepository;
        private readonly IMapper _mapper;

        public GetStaffByIdQueryHandler(
            IStaffRepositoryAsync staffRepository,
            IShiftRepositoryAsync shiftRepository,
            IMapper mapper)
        {
            _staffRepository = staffRepository;
            _shiftRepository = shiftRepository;
            _mapper = mapper;
        }

        public async Task<GetStaffByIdViewModel> Handle(GetStaffByIdQuery request, CancellationToken cancellationToken)
        {
            var staff = await _staffRepository.GetByIdAsync(request.Id);
            
            if (staff == null)
            {
                throw new EntityNotFoundException("Staff", request.Id);
            }
            
            var staffViewModel = _mapper.Map<GetStaffByIdViewModel>(staff);
            
            // Set status
            staffViewModel.Status = staff.IsActive ? "Active" : "On Leave";
            
            // Get staff shifts
            var shifts = await _shiftRepository.GetShiftsByStaffIdAsync(request.Id);
            
            // Map shifts to view model
            var shiftViewModels = _mapper.Map<List<ShiftViewModel>>(shifts);
            staffViewModel.Shifts = shiftViewModels;
            
            return staffViewModel;
        }
    }
}