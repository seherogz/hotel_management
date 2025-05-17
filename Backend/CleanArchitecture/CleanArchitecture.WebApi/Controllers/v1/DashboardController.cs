// Backend/CleanArchitecture/CleanArchitecture.WebApi/Controllers/v1/DashboardController.cs
using CleanArchitecture.Core.Features.Dashboard.Queries;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace CleanArchitecture.WebApi.Controllers.v1
{
    [ApiVersion("1.0")]
    [Authorize] // Bu endpoint'e erişim için yetkilendirme gereksin
    public class DashboardController : BaseApiController
    {
        // GET: api/v1/Dashboard/Summary
        [HttpGet("Summary")]
        [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(DashboardSummaryViewModel))]
        public async Task<IActionResult> GetSummary()
        {
            return Ok(await Mediator.Send(new GetDashboardSummaryQuery()));
        }
    }
}