using CleanArchitecture.Core.Interfaces.Repositories;
using FluentValidation;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Income.Commands.CreateIncome
{
    public class CreateIncomeCommandValidator : AbstractValidator<CreateIncomeCommand>
    {
        private readonly IIncomeRepositoryAsync _incomeRepository;

        public CreateIncomeCommandValidator(IIncomeRepositoryAsync incomeRepository)
        {
            _incomeRepository = incomeRepository;

            RuleFor(i => i.IncomeNumber)
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.")
                .MustAsync(IsUniqueIncomeNumber).WithMessage("{PropertyName} already exists.");

            RuleFor(i => i.CustomerName)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(100).WithMessage("{PropertyName} must not exceed 100 characters.");

            RuleFor(i => i.RoomNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(10).WithMessage("{PropertyName} must not exceed 10 characters.");

            RuleFor(i => i.Amount)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.");

            RuleFor(i => i.Date)
                .NotEmpty().WithMessage("{PropertyName} is required.");
        }

        private async Task<bool> IsUniqueIncomeNumber(string incomeNumber, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(incomeNumber))
            {
                // Will be auto-generated
                return true;
            }
            
            return await _incomeRepository.IsUniqueIncomeNumberAsync(incomeNumber);
        }
    }
}