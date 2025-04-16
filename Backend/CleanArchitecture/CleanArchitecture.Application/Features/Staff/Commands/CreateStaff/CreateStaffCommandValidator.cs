using CleanArchitecture.Core.Interfaces.Repositories;
using FluentValidation;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Staff.Commands.CreateStaff
{
    public class CreateStaffCommandValidator : AbstractValidator<CreateStaffCommand>
    {
        private readonly IStaffRepositoryAsync _staffRepository;

        public CreateStaffCommandValidator(IStaffRepositoryAsync staffRepository)
        {
            _staffRepository = staffRepository;

            RuleFor(s => s.Name)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(s => s.Department)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(s => s.Role)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(s => s.Email)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .EmailAddress().WithMessage("{PropertyName} must be a valid email address.")
                .MustAsync(IsUniqueEmail).WithMessage("{PropertyName} already exists.");

            RuleFor(s => s.PhoneNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.")
                .MustAsync(IsUniquePhoneNumber).WithMessage("{PropertyName} already exists.");

            RuleFor(s => s.Salary)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.");

            RuleFor(s => s.StartDate)
                .NotEmpty().WithMessage("{PropertyName} is required.");
        }

        private async Task<bool> IsUniqueEmail(string email, CancellationToken cancellationToken)
        {
            return await _staffRepository.IsUniqueEmailAsync(email);
        }

        private async Task<bool> IsUniquePhoneNumber(string phoneNumber, CancellationToken cancellationToken)
        {
            return await _staffRepository.IsUniquePhoneNumberAsync(phoneNumber);
        }
    }
}