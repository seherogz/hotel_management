using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Income.Queries.GetIncomes
{
    public class GetIncomesQuery : IRequest<PagedResponse<GetIncomesViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string CustomerName { get; set; }
    }

    public class GetIncomesQueryHandler : IRequestHandler<GetIncomesQuery, PagedResponse<GetIncomesViewModel>>
    {
        private readonly IIncomeRepositoryAsync _incomeRepository;
        private readonly IMapper _mapper;

        public GetIncomesQueryHandler(
            IIncomeRepositoryAsync incomeRepository,
            IMapper mapper)
        {
            _incomeRepository = incomeRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetIncomesViewModel>> Handle(GetIncomesQuery request, CancellationToken cancellationToken)
        {
            IReadOnlyList<Entities.Income> incomes;
            
            // Apply date range filter if provided
            if (request.StartDate.HasValue && request.EndDate.HasValue)
            {
                incomes = await _incomeRepository.GetIncomesByDateRangeAsync(
                    request.StartDate.Value, request.EndDate.Value);
            }
            // Apply customer name filter if provided
            else if (!string.IsNullOrEmpty(request.CustomerName))
            {
                incomes = await _incomeRepository.GetIncomesByCustomerNameAsync(request.CustomerName);
            }
            // Get all incomes (paged)
            else
            {
                incomes = await _incomeRepository.GetPagedReponseAsync(request.PageNumber, request.PageSize);
            }
            
            // Apply customer name filter if date range was provided
            if (request.StartDate.HasValue && request.EndDate.HasValue && !string.IsNullOrEmpty(request.CustomerName))
            {
                incomes = incomes
                    .Where(i => i.CustomerName.Contains(request.CustomerName, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }
            
            // Apply paging if specific filters were applied
            var pagedIncomes = incomes
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();
            
            var incomeViewModels = _mapper.Map<List<GetIncomesViewModel>>(pagedIncomes);
            
            return new PagedResponse<GetIncomesViewModel>(
                incomeViewModels, request.PageNumber, request.PageSize, incomes.Count);
        }
    }
}