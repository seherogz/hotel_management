using CleanArchitecture.Core.Features.Amenities.Commands.AddAmenityToRoom;
using CleanArchitecture.Core.Features.Amenities.Queries.GetRoomAmenities;
using CleanArchitecture.Core.Features.MaintenanceIssues.Commands.AddMaintenanceIssue;
using CleanArchitecture.Core.Features.MaintenanceIssues.Queries.GetMaintenanceIssuesByRoom;
using CleanArchitecture.Core.Features.Rooms.Commands.CreateRoom;
using CleanArchitecture.Core.Features.Rooms.Commands.DeleteRoomById;
using CleanArchitecture.Core.Features.Rooms.Commands.UpdateRoom;
using CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms;
using CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById;
using CleanArchitecture.Core.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CleanArchitecture.Core.Features.MaintenanceIssues.Commands.ResolveMaintenanceIssue;

namespace CleanArchitecture.WebApi.Controllers.v1
{
    [ApiVersion("1.0")]
    [Authorize]
    public class RoomController : BaseApiController
    {
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
                Floor = filter.Floor,
                IsOnMaintenance = filter.IsOnMaintenance, // <<< EKLENDİ
                AvailabilityStartDate = filter.AvailabilityStartDate, // <<< EKLENDİ
                AvailabilityEndDate = filter.AvailabilityEndDate, // <<< EKLENDİ
                StatusCheckDate = filter.StatusCheckDate
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
        public async Task<IActionResult> GetMaintenanceIssues(int id) // CreatedAtAction'ın referans verdiği metod
        {
            return Ok(await Mediator.Send(new GetMaintenanceIssuesByRoomQuery { RoomId = id }));
        }

        [HttpPost("{id}/maintenance-issues")]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(object))] // Yanıt tipini güncelledik
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        // Parametre olarak AddMaintenanceIssueRequest DTO'sunu [FromBody] ile alın
        public async Task<IActionResult> AddMaintenanceIssue(int id, [FromBody] AddMaintenanceIssueRequest requestBody)
        {
            // Mediator'a gönderilecek Command nesnesini oluşturun
            var command = new AddMaintenanceIssueCommand
            {
                // RoomId'yi route parametresi 'id' den alın
                RoomId = id,
                // Diğer özellikleri requestBody DTO'sundan atayın
                IssueDescription = requestBody.IssueDescription,
                EstimatedCompletionDate = requestBody.EstimatedCompletionDate
            };

            // Command'ı Mediator ile gönderin
            var issueId = await Mediator.Send(command);

            // CreatedAtAction yanıtını doğru route değerleri ile döndürün
            return CreatedAtAction(nameof(GetMaintenanceIssues), new { id = id }, new { id = issueId });
        }

        
        // POST: api/v1/Room/{roomId}/maintenance-issues/{issueId}/resolve
        [HttpPost("{roomId}/maintenance-issues/{issueId}/resolve")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(object))] // Yanıt tipini güncelledik
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResolveMaintenanceIssue(int roomId, int issueId)
        {
            var resultRoomId = await Mediator.Send(new ResolveMaintenanceIssueCommand { RoomId = roomId, MaintenanceIssueId = issueId });
            return Ok(new { Message = $"Maintenance issue {issueId} for room {roomId} resolved.", RoomId = resultRoomId });
        }
    }
}