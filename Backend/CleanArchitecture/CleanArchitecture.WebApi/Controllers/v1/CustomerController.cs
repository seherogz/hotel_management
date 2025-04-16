using CleanArchitecture.Core.Features.Customers.Commands.CreateCustomer;
using CleanArchitecture.Core.Features.Customers.Commands.DeleteCustomer;
using CleanArchitecture.Core.Features.Customers.Commands.UpdateCustomer;
using CleanArchitecture.Core.Features.Customers.Queries.GetAllCustomers;
using CleanArchitecture.Core.Features.Customers.Queries.GetCustomerById;
using CleanArchitecture.Core.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.WebApi.Controllers.v1
{
    [ApiVersion("1.0")]
    [Authorize]
    public class CustomerController : BaseApiController
    {
        // GET: api/v1/Customer
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetAllCustomersViewModel>))]
        public async Task<PagedResponse<GetAllCustomersViewModel>> Get([FromQuery] GetAllCustomersParameter filter)
        {
            return await Mediator.Send(new GetAllCustomersQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                Status = filter.Status
            });
        }

        // GET: api/v1/Customer/5
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetCustomerByIdViewModel))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(int id)
        {
            return Ok(await Mediator.Send(new GetCustomerByIdQuery { Id = id }));
        }

        // POST: api/v1/Customer
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Post(CreateCustomerCommand command)
        {
            var id = await Mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id }, new { id });
        }

        // PUT: api/v1/Customer/5
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Put(int id, UpdateCustomerCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest();
            }
            return Ok(await Mediator.Send(command));
        }

        // DELETE: api/v1/Customer/5
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Delete(int id)
        {
            return Ok(await Mediator.Send(new DeleteCustomerCommand { Id = id }));
        }
    }
}