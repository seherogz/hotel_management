using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Expense.Commands.DeleteExpense
{
    public class DeleteExpenseCommand : IRequest<int>
    {
        public int Id { get; set; }
    }

    public class DeleteExpenseCommandHandler : IRequestHandler<DeleteExpenseCommand, int>
    {
        private readonly IExpenseRepositoryAsync _expenseRepository;

        public DeleteExpenseCommandHandler(IExpenseRepositoryAsync expenseRepository)
        {
            _expenseRepository = expenseRepository;
        }

        public async Task<int> Handle(DeleteExpenseCommand request, CancellationToken cancellationToken)
        {
            var expense = await _expenseRepository.GetByIdAsync(request.Id);
            
            if (expense == null)
            {
                throw new EntityNotFoundException("Entity", request.Id);
            }
            
            await _expenseRepository.DeleteAsync(expense);
            
            return expense.Id;
        }
    }
}