using AutoMapper;
using CleanArchitecture.Core.Entities; // <-- Entity için doğru using
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Staff.Commands.UpdateStaff
{
    // Komut sınıfı: FirstName ve LastName içerecek şekilde güncellendi
    public class UpdateStaffCommand : IRequest<int>
    {
        public int Id { get; set; }
        // public string Name { get; set; } // <-- ESKİ SATIR
        public string FirstName { get; set; } // <-- YENİ SATIR
        public string LastName { get; set; }  // <-- YENİ SATIR
        public string Department { get; set; }
        public string Role { get; set; }
        public DateTime StartDate { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public decimal Salary { get; set; }
        public bool IsActive { get; set; }
    }

    // Komut işleyici sınıfı: Handler metodu FirstName ve LastName kullanacak şekilde güncellendi
    public class UpdateStaffCommandHandler : IRequestHandler<UpdateStaffCommand, int>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IMapper _mapper; // AutoMapper kullanılıyorsa, profilin de güncellenmesi gerekebilir.

        public UpdateStaffCommandHandler(
            IStaffRepositoryAsync staffRepository,
            IMapper mapper)
        {
            _staffRepository = staffRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(UpdateStaffCommand request, CancellationToken cancellationToken)
        {
            var staff = await _staffRepository.GetByIdAsync(request.Id);

            if (staff == null)
            {
                // "Entity" yerine daha spesifik "Staff" kullanmak daha iyi olabilir
                throw new EntityNotFoundException("Staff", request.Id);
            }

            // Check if email is being changed and if it's unique
            if (staff.Email != request.Email)
            {
                var isEmailUnique = await _staffRepository.IsUniqueEmailAsync(request.Email);
                if (!isEmailUnique)
                {
                    throw new ValidationException($"Email {request.Email} is already in use.");
                }
            }

            // Check if phone number is being changed and if it's unique
            if (staff.PhoneNumber != request.PhoneNumber)
            {
                var isPhoneUnique = await _staffRepository.IsUniquePhoneNumberAsync(request.PhoneNumber);
                if (!isPhoneUnique)
                {
                    throw new ValidationException($"Phone number {request.PhoneNumber} is already in use.");
                }
            }

            // Update staff properties using FirstName and LastName
            // staff.Name = request.Name; // <-- ESKİ SATIR
            staff.FirstName = request.FirstName; // <-- YENİ SATIR
            staff.LastName = request.LastName; // <-- YENİ SATIR
            staff.Department = request.Department;
            staff.Role = request.Role;
            staff.StartDate = request.StartDate;
            staff.Email = request.Email;
            staff.PhoneNumber = request.PhoneNumber;
            staff.Salary = request.Salary;
            staff.IsActive = request.IsActive;

            // Eğer AutoMapper ile request'ten entity'e map yapıyorsanız,
            // GeneralProfile.cs içindeki ilgili CreateMap<UpdateStaffCommand, Staff>()
            // eşlemesini de Name yerine FirstName/LastName kullanacak şekilde güncellemeniz gerekir.
            // Örneğin: .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.FirstName))
            //          .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.LastName))
            // Eğer burada olduğu gibi manuel atama yapıyorsanız AutoMapper'a gerek yok.

            await _staffRepository.UpdateAsync(staff);

            return staff.Id;
        }
    }
}