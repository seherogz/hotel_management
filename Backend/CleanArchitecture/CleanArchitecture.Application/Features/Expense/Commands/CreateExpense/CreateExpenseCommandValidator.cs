using CleanArchitecture.Core.Interfaces.Repositories;
using FluentValidation;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Expense.Commands.CreateExpense
{
    public class CreateExpenseCommandValidator : AbstractValidator<CreateExpenseCommand>
    {
        private readonly IExpenseRepositoryAsync _expenseRepository;

        public CreateExpenseCommandValidator(IExpenseRepositoryAsync expenseRepository)
        {
            _expenseRepository = expenseRepository;

            RuleFor(e => e.ExpenseNumber)
                .MaximumLength(20).WithMessage("{PropertyName} must not exceed 20 characters.")
                .MustAsync(IsUniqueExpenseNumber).WithMessage("{PropertyName} already exists.");

            RuleFor(e => e.Category)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.");

            RuleFor(e => e.Description)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(255).WithMessage("{PropertyName} must not exceed 255 characters.");

            RuleFor(e => e.Amount)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.");

            RuleFor(e => e.Date)
                .NotEmpty().WithMessage("{PropertyName} is required.");
        }

        private async Task<bool> IsUniqueExpenseNumber(string expenseNumber, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(expenseNumber))
            {
                // Will be auto-generated
                return true;
            }
            
            return await _expenseRepository.IsUniqueExpenseNumberAsync(expenseNumber);
        }
    }
}