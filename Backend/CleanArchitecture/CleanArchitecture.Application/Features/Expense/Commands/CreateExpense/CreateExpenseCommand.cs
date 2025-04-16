using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Expense.Commands.CreateExpense
{
    public class CreateExpenseCommand : IRequest<int>
    {
        public string ExpenseNumber { get; set; }
        public DateTime Date { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public decimal Amount { get; set; }
    }

    public class CreateExpenseCommandHandler : IRequestHandler<CreateExpenseCommand, int>
    {
        private readonly IExpenseRepositoryAsync _expenseRepository;
        private readonly IMapper _mapper;

        public CreateExpenseCommandHandler(
            IExpenseRepositoryAsync expenseRepository,
            IMapper mapper)
        {
            _expenseRepository = expenseRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(CreateExpenseCommand request, CancellationToken cancellationToken)
        {
            // Generate expense number if not provided
            if (string.IsNullOrEmpty(request.ExpenseNumber))
            {
                // Format: EXP + year (2 digits) + month (2 digits) + random 3 digits
                var random = new Random();
                var randomPart = random.Next(100, 999).ToString();
                request.ExpenseNumber = $"EXP{DateTime.Now:yyMM}{randomPart}";
            }

            var expense = _mapper.Map<Entities.Expense>(request);
            await _expenseRepository.AddAsync(expense);
            return expense.Id;
        }
    }
}