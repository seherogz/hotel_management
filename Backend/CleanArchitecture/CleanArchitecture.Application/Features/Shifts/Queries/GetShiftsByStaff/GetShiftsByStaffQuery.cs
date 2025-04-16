using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Shifts.Queries.GetShiftsByStaff
{
    public class GetShiftsByStaffQuery : IRequest<List<GetShiftsByStaffViewModel>>
    {
        public int StaffId { get; set; }
    }

    public class GetShiftsByStaffQueryHandler : IRequestHandler<GetShiftsByStaffQuery, List<GetShiftsByStaffViewModel>>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IShiftRepositoryAsync _shiftRepository;
        private readonly IMapper _mapper;

        public GetShiftsByStaffQueryHandler(
            IStaffRepositoryAsync staffRepository,
            IShiftRepositoryAsync shiftRepository,
            IMapper mapper)
        {
            _staffRepository = staffRepository;
            _shiftRepository = shiftRepository;
            _mapper = mapper;
        }

        public async Task<List<GetShiftsByStaffViewModel>> Handle(GetShiftsByStaffQuery request, CancellationToken cancellationToken)
        {
            // Validate staff exists
            var staff = await _staffRepository.GetByIdAsync(request.StaffId);
            if (staff == null)
            {
                throw new EntityNotFoundException("Staff", request.StaffId);
            }
            
            // Get shifts for the staff
            var shifts = await _shiftRepository.GetShiftsByStaffIdAsync(request.StaffId);
            
            // Map to view models
            var shiftsViewModels = _mapper.Map<List<GetShiftsByStaffViewModel>>(shifts);
            
            return shiftsViewModels;
        }
    }
}