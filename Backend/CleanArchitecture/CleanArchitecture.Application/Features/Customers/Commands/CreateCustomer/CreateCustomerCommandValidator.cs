using CleanArchitecture.Core.Interfaces.Repositories;
using FluentValidation;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Customers.Commands.CreateCustomer
{
    public class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
    {
        private readonly ICustomerRepositoryAsync _customerRepository;

        public CreateCustomerCommandValidator(ICustomerRepositoryAsync customerRepository)
        {
            _customerRepository = customerRepository;

            RuleFor(c => c.FirstName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(c => c.LastName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(c => c.Email)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .EmailAddress().WithMessage("{PropertyName} must be a valid email address.")
                .MustAsync(IsUniqueEmail).WithMessage("{PropertyName} already exists.");

            RuleFor(c => c.Phone)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.")
                .MustAsync(IsUniquePhone).WithMessage("{PropertyName} already exists.");

            RuleFor(c => c.Status)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Must(s => s == "VIP" || s == "Standard")
                .WithMessage("{PropertyName} must be either VIP or Standard.");
        }

        private async Task<bool> IsUniqueEmail(string email, CancellationToken cancellationToken)
        {
            return await _customerRepository.IsUniqueEmailAsync(email);
        }

        private async Task<bool> IsUniquePhone(string phone, CancellationToken cancellationToken)
        {
            return await _customerRepository.IsUniquePhoneAsync(phone);
        }
    }
}