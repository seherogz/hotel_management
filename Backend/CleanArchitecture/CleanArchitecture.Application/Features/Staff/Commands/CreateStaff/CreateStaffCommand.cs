using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Staff.Commands.CreateStaff
{
    public class CreateStaffCommand : IRequest<int>
    {
        public string FirstName { get; set; }  // EKLENDİ
        public string LastName { get; set; }
        public string Department { get; set; }
        public string Role { get; set; }
        public DateTime StartDate { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public decimal Salary { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class CreateStaffCommandHandler : IRequestHandler<CreateStaffCommand, int>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IMapper _mapper;

        public CreateStaffCommandHandler(
            IStaffRepositoryAsync staffRepository,
            IMapper mapper)
        {
            _staffRepository = staffRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(CreateStaffCommand request, CancellationToken cancellationToken)
        {
            var staff = _mapper.Map<Entities.Staff>(request);
            await _staffRepository.AddAsync(staff);
            return staff.Id;
        }
    }
}