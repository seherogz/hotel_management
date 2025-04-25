using MediatR;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;

namespace CleanArchitecture.Core.Features.Expense.Commands.UpdateExpense
{
    public class UpdateExpenseCommand : IRequest<int>
    {
        [Required]
        public int Id { get; set; } // Route'dan alınacak

        // Opsiyonel: ExpenseNumber güncellenebilir mi?
        // public string ExpenseNumber { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(50)]
        public string Category { get; set; }

        [Required]
        [MaxLength(255)]
        public string Description { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
    }
    public class UpdateExpenseCommandHandler : IRequestHandler<UpdateExpenseCommand, int>
    {
        private readonly IExpenseRepositoryAsync _expenseRepository;
        private readonly IMapper _mapper;

        public UpdateExpenseCommandHandler(IExpenseRepositoryAsync expenseRepository, IMapper mapper)
        {
            _expenseRepository = expenseRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(UpdateExpenseCommand request, CancellationToken cancellationToken)
        {
            var expense = await _expenseRepository.GetByIdAsync(request.Id);

            if (expense == null)
            {
                throw new EntityNotFoundException(nameof(Expense), request.Id);
            }

            _mapper.Map(request, expense);

            // Eğer ExpenseNumber güncelleniyorsa ve unique kontrolü gerekiyorsa burada yapılmalı.

            await _expenseRepository.UpdateAsync(expense);
            return expense.Id;
        }
    }
}