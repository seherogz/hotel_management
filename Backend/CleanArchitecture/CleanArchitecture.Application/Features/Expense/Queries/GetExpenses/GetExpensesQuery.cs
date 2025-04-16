using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Expense.Queries.GetExpenses
{
    public class GetExpensesQuery : IRequest<PagedResponse<GetExpensesViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string Category { get; set; }
    }

    public class GetExpensesQueryHandler : IRequestHandler<GetExpensesQuery, PagedResponse<GetExpensesViewModel>>
    {
        private readonly IExpenseRepositoryAsync _expenseRepository;
        private readonly IMapper _mapper;

        public GetExpensesQueryHandler(
            IExpenseRepositoryAsync expenseRepository,
            IMapper mapper)
        {
            _expenseRepository = expenseRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetExpensesViewModel>> Handle(GetExpensesQuery request, CancellationToken cancellationToken)
        {
            IReadOnlyList<Entities.Expense> expenses;
            
            // Apply date range filter if provided
            if (request.StartDate.HasValue && request.EndDate.HasValue)
            {
                expenses = await _expenseRepository.GetExpensesByDateRangeAsync(
                    request.StartDate.Value, request.EndDate.Value);
            }
            // Apply category filter if provided
            else if (!string.IsNullOrEmpty(request.Category))
            {
                expenses = await _expenseRepository.GetExpensesByCategoryAsync(request.Category);
            }
            // Get all expenses (paged)
            else
            {
                expenses = await _expenseRepository.GetPagedReponseAsync(request.PageNumber, request.PageSize);
            }
            
            // Apply category filter if date range was provided
            if (request.StartDate.HasValue && request.EndDate.HasValue && !string.IsNullOrEmpty(request.Category))
            {
                expenses = expenses
                    .Where(e => e.Category == request.Category)
                    .ToList();
            }
            
            // Apply paging if specific filters were applied
            var pagedExpenses = expenses
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();
            
            var expenseViewModels = _mapper.Map<List<GetExpensesViewModel>>(pagedExpenses);
            
            return new PagedResponse<GetExpensesViewModel>(
                expenseViewModels, request.PageNumber, request.PageSize, expenses.Count);
        }
    }
}