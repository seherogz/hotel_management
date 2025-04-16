using CleanArchitecture.Core.Features.Shifts.Commands.AssignShifts;
using CleanArchitecture.Core.Features.Shifts.Queries.GetShiftsByStaff;
using CleanArchitecture.Core.Features.Staff.Commands.CreateStaff;
using CleanArchitecture.Core.Features.Staff.Commands.DeleteStaff;
using CleanArchitecture.Core.Features.Staff.Commands.UpdateStaff;
using CleanArchitecture.Core.Features.Staff.Queries.GetAllStaff;
using CleanArchitecture.Core.Features.Staff.Queries.GetStaffById;
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
    public class StaffController : BaseApiController
    {
        // GET: api/v1/Staff
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetAllStaffViewModel>))]
        public async Task<PagedResponse<GetAllStaffViewModel>> Get([FromQuery] GetAllStaffParameter filter)
        {
            return await Mediator.Send(new GetAllStaffQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                Department = filter.Department,
                Role = filter.Role,
                IsActive = filter.IsActive
            });
        }

        // GET: api/v1/Staff/5
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetStaffByIdViewModel))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(int id)
        {
            return Ok(await Mediator.Send(new GetStaffByIdQuery { Id = id }));
        }

        // POST: api/v1/Staff
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Post(CreateStaffCommand command)
        {
            var id = await Mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id }, new { id });
        }

        // PUT: api/v1/Staff/5
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Put(int id, UpdateStaffCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest();
            }
            return Ok(await Mediator.Send(command));
        }

        // DELETE: api/v1/Staff/5
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            return Ok(await Mediator.Send(new DeleteStaffCommand { Id = id }));
        }

        // GET: api/v1/Staff/5/shifts
        [HttpGet("{id}/shifts")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<GetShiftsByStaffViewModel>))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetShifts(int id)
        {
            return Ok(await Mediator.Send(new GetShiftsByStaffQuery { StaffId = id }));
        }

        // POST: api/v1/Staff/5/shifts
        [HttpPost("{id}/shifts")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AssignShifts(int id, [FromBody] List<ShiftDetail> shifts)
        {
            return Ok(await Mediator.Send(new AssignShiftsCommand
            {
                StaffId = id,
                Shifts = shifts
            }));
        }
    }
}