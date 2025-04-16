using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Staff.Queries.GetAllStaff
{
    public class GetAllStaffQuery : IRequest<PagedResponse<GetAllStaffViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public string Department { get; set; }
        public string Role { get; set; }
        public bool? IsActive { get; set; }
    }

    public class GetAllStaffQueryHandler : IRequestHandler<GetAllStaffQuery, PagedResponse<GetAllStaffViewModel>>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IMapper _mapper;

        public GetAllStaffQueryHandler(
            IStaffRepositoryAsync staffRepository,
            IMapper mapper)
        {
            _staffRepository = staffRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetAllStaffViewModel>> Handle(GetAllStaffQuery request, CancellationToken cancellationToken)
        {
            IReadOnlyList<Entities.Staff> staff;
            
            // Apply department filter if provided
            if (!string.IsNullOrEmpty(request.Department))
            {
                staff = await _staffRepository.GetStaffByDepartmentAsync(request.Department);
            }
            // Apply role filter if provided
            else if (!string.IsNullOrEmpty(request.Role))
            {
                staff = await _staffRepository.GetStaffByRoleAsync(request.Role);
            }
            // Apply active status filter if provided
            else if (request.IsActive.HasValue && request.IsActive.Value)
            {
                staff = await _staffRepository.GetActiveStaffAsync();
            }
            // Get all staff (paged)
            else
            {
                staff = await _staffRepository.GetPagedReponseAsync(request.PageNumber, request.PageSize);
            }
            
            // Filter by active status if it wasn't the primary filter and is provided
            if (request.IsActive.HasValue && !string.IsNullOrEmpty(request.Department + request.Role))
            {
                staff = staff.Where(s => s.IsActive == request.IsActive.Value).ToList();
            }
            
            // Apply paging if specific filters were applied
            var pagedStaff = staff
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();
            
            var staffViewModels = new List<GetAllStaffViewModel>();
            
            foreach (var staffMember in pagedStaff)
            {
                var viewModel = new GetAllStaffViewModel
                {
                    Id = staffMember.Id,
                    // Name = staffMember.Name, // <-- ESKİ SATIR
                    Name = $"{staffMember.FirstName} {staffMember.LastName}", // <-- YENİ SATIR (Ad ve Soyadı birleştir)
                    Position = $"{staffMember.Role} ({staffMember.Department})",
                    Department = staffMember.Department,
                    Email = staffMember.Email,
                    PhoneNumber = staffMember.PhoneNumber,
                    Status = staffMember.IsActive ? "Active" : "On Leave",
                    StartDate = staffMember.StartDate
                };
                staffViewModels.Add(viewModel);
            }
            
            return new PagedResponse<GetAllStaffViewModel>(
                staffViewModels, request.PageNumber, request.PageSize, staff.Count);
        }
    }
}