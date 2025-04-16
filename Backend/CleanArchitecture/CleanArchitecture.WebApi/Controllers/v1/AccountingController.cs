using CleanArchitecture.Core.Features.Expense.Commands.CreateExpense;
using CleanArchitecture.Core.Features.Expense.Commands.DeleteExpense;
using CleanArchitecture.Core.Features.Expense.Queries.GetExpenses;
using CleanArchitecture.Core.Features.Income.Commands.CreateIncome;
using CleanArchitecture.Core.Features.Income.Queries.GetIncomes;
using CleanArchitecture.Core.Features.Transactions.Queries.GetTransactionSummary;
using CleanArchitecture.Core.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.WebApi.Controllers.v1
{
    [ApiVersion("1.0")]
    [Authorize]
    public class AccountingController : BaseApiController
    {
        // GET: api/v1/Accounting/incomes
        [HttpGet("incomes")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetIncomesViewModel>))]
        public async Task<PagedResponse<GetIncomesViewModel>> GetIncomes([FromQuery] GetIncomesParameter filter)
        {
            return await Mediator.Send(new GetIncomesQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                StartDate = filter.StartDate,
                EndDate = filter.EndDate,
                CustomerName = filter.CustomerName
            });
        }

        // POST: api/v1/Accounting/incomes
        [HttpPost("incomes")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateIncome(CreateIncomeCommand command)
        {
            var id = await Mediator.Send(command);
            return Ok(new { id });
        }

        // GET: api/v1/Accounting/expenses
        [HttpGet("expenses")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetExpensesViewModel>))]
        public async Task<PagedResponse<GetExpensesViewModel>> GetExpenses([FromQuery] GetExpensesParameter filter)
        {
            return await Mediator.Send(new GetExpensesQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                StartDate = filter.StartDate,
                EndDate = filter.EndDate,
                Category = filter.Category
            });
        }

        // POST: api/v1/Accounting/expenses
        [HttpPost("expenses")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreateExpense(CreateExpenseCommand command)
        {
            var id = await Mediator.Send(command);
            return Ok(new { id });
        }

        // DELETE: api/v1/Accounting/expenses/{id}
        [HttpDelete("expenses/{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            return Ok(await Mediator.Send(new DeleteExpenseCommand { Id = id }));
        }

        // GET: api/v1/Accounting/transactions/summary
        [HttpGet("transactions/summary")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetTransactionSummaryViewModel))]
        public async Task<GetTransactionSummaryViewModel> GetTransactionSummary([FromQuery] DateTime? date = null)
        {
            return await Mediator.Send(new GetTransactionSummaryQuery
            {
                Date = date ?? DateTime.Today
            });
        }
    }
}