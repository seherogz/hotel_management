using MediatR;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;

namespace CleanArchitecture.Core.Features.Income.Commands.DeleteIncome
{
    public class DeleteIncomeCommand : IRequest<int>
    {
        [Required]
        public int Id { get; set; } // Route'dan alınacak
    }
    public class DeleteIncomeCommandHandler : IRequestHandler<DeleteIncomeCommand, int>
    {
        private readonly IIncomeRepositoryAsync _incomeRepository;

        public DeleteIncomeCommandHandler(IIncomeRepositoryAsync incomeRepository)
        {
            _incomeRepository = incomeRepository;
        }

        public async Task<int> Handle(DeleteIncomeCommand request, CancellationToken cancellationToken)
        {
            var income = await _incomeRepository.GetByIdAsync(request.Id);

            if (income == null)
            {
                throw new EntityNotFoundException(nameof(Income), request.Id);
            }

            await _incomeRepository.DeleteAsync(income);
            return income.Id;
        }
    }
}