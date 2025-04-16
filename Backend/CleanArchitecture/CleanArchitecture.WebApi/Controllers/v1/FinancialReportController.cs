using CleanArchitecture.Core.Features.FinancialReports.Queries.GetMonthlyDetails;
using CleanArchitecture.Core.Features.FinancialReports.Queries.GetMonthlyFinancialReport;
using CleanArchitecture.Core.Features.FinancialReports.Queries.GetOccupancyRate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.WebApi.Controllers.v1
{
    [ApiVersion("1.0")]
    [Authorize]
    public class FinancialReportController : BaseApiController
    {
        // GET: api/v1/FinancialReport/monthly-summary
        [HttpGet("monthly-summary")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(GetMonthlyFinancialReportViewModel))]
        public async Task<IActionResult> GetMonthlySummary([FromQuery] int year, [FromQuery] string month)
        {
            return Ok(await Mediator.Send(new GetMonthlyFinancialReportQuery
            {
                Year = year,
                Month = month
            }));
        }

        // GET: api/v1/FinancialReport/monthly-details
        [HttpGet("monthly-details")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<GetMonthlyDetailsViewModel>))]
        public async Task<IActionResult> GetMonthlyDetails([FromQuery] int year)
        {
            return Ok(await Mediator.Send(new GetMonthlyDetailsQuery
            {
                Year = year
            }));
        }

        // GET: api/v1/FinancialReport/occupancy-rate
        [HttpGet("occupancy-rate")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(List<GetOccupancyRateViewModel>))]
        public async Task<IActionResult> GetOccupancyRate([FromQuery] int year)
        {
            return Ok(await Mediator.Send(new GetOccupancyRateQuery
            {
                Year = year
            }));
        }
    }
}