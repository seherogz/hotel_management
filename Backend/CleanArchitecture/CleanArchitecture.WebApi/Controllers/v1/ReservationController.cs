using CleanArchitecture.Core.Features.Reservations.Commands.CancelReservation;
using CleanArchitecture.Core.Features.Reservations.Commands.CheckIn;
using CleanArchitecture.Core.Features.Reservations.Commands.CheckOut;
using CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation;
using CleanArchitecture.Core.Features.Reservations.Commands.UpdateReservation;
using CleanArchitecture.Core.Features.Reservations.Queries.GetAllReservations;
using CleanArchitecture.Core.Features.Reservations.Queries.GetCheckIns;
using CleanArchitecture.Core.Features.Reservations.Queries.GetCheckOuts;
using CleanArchitecture.Core.Features.Reservations.Queries.GetReservationById;
using CleanArchitecture.Core.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using CleanArchitecture.Core.Features.Reservations.DTOs;

namespace CleanArchitecture.WebApi.Controllers.v1
{
    [ApiVersion("1.0")]
    [Authorize]
    public class ReservationController : BaseApiController
    {
        // GET: api/v1/Reservation
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetAllReservationsViewModel>))]
        public async Task<PagedResponse<GetAllReservationsViewModel>> Get([FromQuery] GetAllReservationsParameter filter)
        {
            return await Mediator.Send(new GetAllReservationsQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                Status = filter.Status,
                CheckInDate = filter.CheckInDate,
                CheckOutDate = filter.CheckOutDate,
                CustomerId = filter.CustomerId,
                RoomId = filter.RoomId
            });
        }

        // GET: api/v1/Reservation/5
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetReservationByIdViewModel))]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Get(int id)
        {
            return Ok(await Mediator.Send(new GetReservationByIdQuery { Id = id }));
        }

        // POST: api/v1/Reservation
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(CreateReservationResponse))] // Yanıt tipi güncellendi
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Post(CreateReservationCommand command)
        {
            // Mediator.Send artık CreateReservationResponse döndürüyor
            var response = await Mediator.Send(command);

            // CreatedAtAction'da hem ID'yi route değeri olarak, hem de tüm response nesnesini
            // (ID ve Fiyat içeren) yanıt gövdesi olarak döndür.
            return CreatedAtAction(nameof(Get), new { id = response.Id }, response);
        }


        // PUT: api/v1/Reservation/5
        [HttpPut("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Put(int id, UpdateReservationCommand command)
        {
            if (id != command.Id)
            {
                return BadRequest();
            }
            return Ok(await Mediator.Send(command));
        }

        // POST: api/v1/Reservation/5/cancel
        [HttpPost("{id}/cancel")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Cancel(int id)
        {
            return Ok(await Mediator.Send(new CancelReservationCommand { Id = id }));
        }

        // GET: api/v1/Reservation/check-ins
        [HttpGet("check-ins")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetCheckInsViewModel>))]
        public async Task<PagedResponse<GetCheckInsViewModel>> GetCheckIns([FromQuery] GetCheckInsParameter filter)
        {
            return await Mediator.Send(new GetCheckInsQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                CheckInDate = filter.CheckInDate,
                ReservationId = filter.ReservationId,
                CustomerName = filter.CustomerName
            });
        }

        // POST: api/v1/Reservation/5/check-in
        [HttpPost("{id}/check-in")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CheckIn(int id)
        {
            return Ok(await Mediator.Send(new CheckInCommand { Id = id }));
        }

        // GET: api/v1/Reservation/check-outs
        [HttpGet("check-outs")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(PagedResponse<GetCheckOutsViewModel>))]
        public async Task<PagedResponse<GetCheckOutsViewModel>> GetCheckOuts([FromQuery] GetCheckOutsParameter filter)
        {
            return await Mediator.Send(new GetCheckOutsQuery
            {
                PageSize = filter.PageSize,
                PageNumber = filter.PageNumber,
                CheckOutDate = filter.CheckOutDate,
                ReservationId = filter.ReservationId,
                CustomerName = filter.CustomerName
            });
        }

        // POST: api/v1/Reservation/5/check-out
        [HttpPost("{id}/check-out")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> CheckOut(int id)
        {
            return Ok(await Mediator.Send(new CheckOutCommand { Id = id }));
        }
    }
}