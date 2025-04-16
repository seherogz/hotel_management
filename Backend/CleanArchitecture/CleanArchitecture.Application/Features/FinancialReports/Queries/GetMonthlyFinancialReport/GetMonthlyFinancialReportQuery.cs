using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.FinancialReports.Queries.GetMonthlyFinancialReport
{
    public class GetMonthlyFinancialReportQuery : IRequest<GetMonthlyFinancialReportViewModel>
    {
        public int Year { get; set; }
        public string Month { get; set; }
    }

    public class GetMonthlyFinancialReportQueryHandler : IRequestHandler<GetMonthlyFinancialReportQuery, GetMonthlyFinancialReportViewModel>
    {
        private readonly IMonthlyFinancialReportRepositoryAsync _reportRepository;
        private readonly IMapper _mapper;

        public GetMonthlyFinancialReportQueryHandler(
            IMonthlyFinancialReportRepositoryAsync reportRepository,
            IMapper mapper)
        {
            _reportRepository = reportRepository;
            _mapper = mapper;
        }

        public async Task<GetMonthlyFinancialReportViewModel> Handle(GetMonthlyFinancialReportQuery request, CancellationToken cancellationToken)
        {
            var report = await _reportRepository.GetByYearAndMonthAsync(request.Year, request.Month);
            
            if (report == null)
            {
                return new GetMonthlyFinancialReportViewModel
                {
                    Year = request.Year,
                    Month = request.Month,
                    Revenue = 0,
                    Expenses = 0,
                    NetProfit = 0,
                    ProfitMargin = 0,
                    OccupancyRate = 0,
                    Trend = "neutral"
                };
            }
            
            var reportViewModel = _mapper.Map<GetMonthlyFinancialReportViewModel>(report);
            
            return reportViewModel;
        }
    }
}