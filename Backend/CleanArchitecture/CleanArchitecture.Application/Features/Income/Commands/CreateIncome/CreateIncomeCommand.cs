using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Income.Commands.CreateIncome
{
    public class CreateIncomeCommand : IRequest<int>
    {
        public string IncomeNumber { get; set; }
        public DateTime Date { get; set; }
        public string CustomerName { get; set; }
        public string RoomNumber { get; set; }
        public decimal Amount { get; set; }
    }

    public class CreateIncomeCommandHandler : IRequestHandler<CreateIncomeCommand, int>
    {
        private readonly IIncomeRepositoryAsync _incomeRepository;
        private readonly IMapper _mapper;

        public CreateIncomeCommandHandler(
            IIncomeRepositoryAsync incomeRepository,
            IMapper mapper)
        {
            _incomeRepository = incomeRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(CreateIncomeCommand request, CancellationToken cancellationToken)
        {
            // Generate income number if not provided
            if (string.IsNullOrEmpty(request.IncomeNumber))
            {
                // Format: IN + year (2 digits) + month (2 digits) + random 3 digits
                var random = new Random();
                var randomPart = random.Next(100, 999).ToString();
                request.IncomeNumber = $"IN{DateTime.Now:yyMM}{randomPart}";
            }

            var income = _mapper.Map<Entities.Income>(request);
            await _incomeRepository.AddAsync(income);
            return income.Id;
        }
    }
}