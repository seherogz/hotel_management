using CleanArchitecture.Core.Features.Amenities.Commands.AddAmenityToRoom;
using CleanArchitecture.Core.Features.Amenities.Queries.GetRoomAmenities;
using CleanArchitecture.Core.Features.MaintenanceIssues.Commands.AddMaintenanceIssue;
using CleanArchitecture.Core.Features.MaintenanceIssues.Queries.GetMaintenanceIssuesByRoom;
using CleanArchitecture.Core.Features.Rooms.Commands.CancelReservation;
using CleanArchitecture.Core.Features.Rooms.Commands.CreateRoom;
using CleanArchitecture.Core.Features.Rooms.Commands.DeleteRoomById;
using CleanArchitecture.Core.Features.Rooms.Commands.ReserveRoom;
using CleanArchitecture.Core.Features.Rooms.Commands.UpdateMaintenanceStatus;
using CleanArchitecture.Core.Features.Rooms.Commands.UpdateRoom;
using CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms;
using CleanArchitecture.Core.Features.Rooms.Queries.GetAvailableRooms;
using CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById;
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
    public class RoomController : BaseApiController
    {
        // GET: api/v1/Room/available
        [HttpGet("available")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetAvailableRoomsViewModel>))]
        public async Task<PagedResponse<GetAvailableRoomsViewModel>> GetAvailableRooms([FromQuery] GetAvailableRoomsParameter filter)
        {
            return await Mediator.Send(new GetAvailableRoomsQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                StartDate = filter.StartDate,
                EndDate = filter.EndDate,
                RoomType = filter.RoomType,
                Status = filter.Status,
                Features = filter.Features
            });
        }
        
        // POST: api/v1/Room/reserve
        [HttpPost("reserve")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ReserveRoom(ReserveRoomCommand command)
        {
            var id = await Mediator.Send(command);
            return Ok(new { id });
        }
        
        // POST: api/v1/Room/update-maintenance-status
        [HttpPost("update-maintenance-status")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> UpdateMaintenanceStatus(UpdateMaintenanceStatusCommand command)
        {
            var id = await Mediator.Send(command);
            return Ok(new { id });
        }
        
        // POST: api/v1/Room/cancel-reservation
        [HttpPost("cancel-reservation")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CancelReservation(CancelReservationCommand command)
        {
            var result = await Mediator.Send(command);
            return Ok(new { success = result });
        }
        // GET: api/v1/Room
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetAllRoomsViewModel>))]
        public async Task<PagedResponse<GetAllRoomsViewModel>> Get([FromQuery] GetAllRoomsParameter filter)
        {
            return await Mediator.Send(new GetAllRoomsQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                RoomType = filter.RoomType,
                Status = filter.Status,
                Floor = filter.Floor
            });
        }

        // GET: api/v1/Room/5
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetRoomByIdViewModel))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(int id)
        {
            return Ok(await Mediator.Send(new GetRoomByIdQuery { Id = id }));
        }

        // POST: api/v1/Room
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Post(CreateRoomCommand command)
        {
            var id = await Mediator.Send(command);
            return CreatedAtAction(nameof(Get), new { id }, new { id });
        }

        // PUT: api/v1/Room/5
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Put(int id, UpdateRoomCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest();
            }
            return Ok(await Mediator.Send(command));
        }

        // DELETE: api/v1/Room/5
        [HttpDelete("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            return Ok(await Mediator.Send(new DeleteRoomByIdCommand { Id = id }));
        }

        // GET: api/v1/Room/5/amenities
        [HttpGet("{id}/amenities")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<GetRoomAmenitiesViewModel>))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetRoomAmenities(int id)
        {
            return Ok(await Mediator.Send(new GetRoomAmenitiesQuery { RoomId = id }));
        }

        // POST: api/v1/Room/5/amenities
        [HttpPost("{id}/amenities")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AddAmenityToRoom(int id, [FromBody] List<string> amenityNames)
        {
            return Ok(await Mediator.Send(new AddAmenityToRoomCommand
            {
                RoomId = id,
                AmenityNames = amenityNames
            }));
        }

        // GET: api/v1/Room/5/maintenance-issues
        [HttpGet("{id}/maintenance-issues")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<GetMaintenanceIssuesByRoomViewModel>))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetMaintenanceIssues(int id)
        {
            return Ok(await Mediator.Send(new GetMaintenanceIssuesByRoomQuery { RoomId = id }));
        }

        // POST: api/v1/Room/5/maintenance-issues
        [HttpPost("{id}/maintenance-issues")]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> AddMaintenanceIssue(int id, AddMaintenanceIssueCommand command)
        {
            if (id != command.RoomId)
            {
                return BadRequest();
            }
            var issueId = await Mediator.Send(command);
            return CreatedAtAction(nameof(GetMaintenanceIssues), new { id }, new { id = issueId });
        }
    }
}