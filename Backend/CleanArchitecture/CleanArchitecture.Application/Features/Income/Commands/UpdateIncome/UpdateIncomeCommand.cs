using MediatR;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;

namespace CleanArchitecture.Core.Features.Income.Commands.UpdateIncome
{
    public class UpdateIncomeCommand : IRequest<int>
    {
        [Required]
        public int Id { get; set; } // Route'dan alınacak

        // Opsiyonel: IncomeNumber güncellenebilir mi?
        // Eğer güncellenebilecekse ve unique olması gerekiyorsa validation eklenmeli.
        // public string IncomeNumber { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        [MaxLength(100)]
        public string CustomerName { get; set; }

        [Required]
        [MaxLength(10)]
        public string RoomNumber { get; set; }

        [Required]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }
    }
    
    public class UpdateIncomeCommandHandler : IRequestHandler<UpdateIncomeCommand, int>
    {
        private readonly IIncomeRepositoryAsync _incomeRepository;
        private readonly IMapper _mapper;

        public UpdateIncomeCommandHandler(IIncomeRepositoryAsync incomeRepository, IMapper mapper)
        {
            _incomeRepository = incomeRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(UpdateIncomeCommand request, CancellationToken cancellationToken)
        {
            var income = await _incomeRepository.GetByIdAsync(request.Id);

            if (income == null)
            {
                throw new EntityNotFoundException(nameof(Income), request.Id);
            }

            // Gelen verileri mevcut entity üzerine map'le
            // AutoMapper kullanmak yerine manuel atama da yapılabilir.
            _mapper.Map(request, income);

            // Eğer IncomeNumber güncelleniyorsa ve unique kontrolü gerekiyorsa burada yapılmalı.
            // var isUnique = await _incomeRepository.IsUniqueIncomeNumberAsync(request.IncomeNumber);
            // if(!isUnique && income.IncomeNumber != request.IncomeNumber) { ... }

            await _incomeRepository.UpdateAsync(income);
            return income.Id;
        }
    }
}