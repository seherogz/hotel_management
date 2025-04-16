using System.Collections.Generic;
using System.Threading.Tasks;
using CleanArchitecture.Application.Features.Rooms.Commands;
using CleanArchitecture.Application.Features.Rooms.DTOs;
using CleanArchitecture.Application.Features.Rooms.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CleanArchitecture.WebApi.Controllers.v1
{
    [ApiVersion("1.0")]
    public class AmenityController : BaseApiController
    {
        [HttpGet]
        public async Task<ActionResult<List<AmenityDto>>> Get([FromQuery] GetAmenitiesQuery query)
        {
            return await Mediator.Send(query);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<int>> Create(CreateAmenityCommand command)
        {
            return await Mediator.Send(command);
        }
    }
} 