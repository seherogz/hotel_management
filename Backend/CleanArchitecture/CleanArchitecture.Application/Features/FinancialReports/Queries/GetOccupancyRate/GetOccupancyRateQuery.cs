using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.FinancialReports.Queries.GetOccupancyRate
{
    public class GetOccupancyRateQuery : IRequest<List<GetOccupancyRateViewModel>>
    {
        public int Year { get; set; }
    }

    public class GetOccupancyRateQueryHandler : IRequestHandler<GetOccupancyRateQuery, List<GetOccupancyRateViewModel>>
    {
        private readonly IMonthlyFinancialReportRepositoryAsync _reportRepository;
        private readonly IMapper _mapper;

        public GetOccupancyRateQueryHandler(
            IMonthlyFinancialReportRepositoryAsync reportRepository,
            IMapper mapper)
        {
            _reportRepository = reportRepository;
            _mapper = mapper;
        }

        public async Task<List<GetOccupancyRateViewModel>> Handle(GetOccupancyRateQuery request, CancellationToken cancellationToken)
        {
            var reports = await _reportRepository.GetByYearAsync(request.Year);
            
            var occupancyRates = new List<GetOccupancyRateViewModel>();
            
            foreach (var report in reports)
            {
                occupancyRates.Add(new GetOccupancyRateViewModel
                {
                    Month = report.Month,
                    OccupancyRate = report.OccupancyRate
                });
            }
            
            return occupancyRates;
        }
    }
}