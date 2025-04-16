using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.FinancialReports.Queries.GetMonthlyDetails
{
    public class GetMonthlyDetailsQuery : IRequest<List<GetMonthlyDetailsViewModel>>
    {
        public int Year { get; set; }
    }

    public class GetMonthlyDetailsQueryHandler : IRequestHandler<GetMonthlyDetailsQuery, List<GetMonthlyDetailsViewModel>>
    {
        private readonly IMonthlyFinancialReportRepositoryAsync _reportRepository;
        private readonly IMapper _mapper;

        public GetMonthlyDetailsQueryHandler(
            IMonthlyFinancialReportRepositoryAsync reportRepository,
            IMapper mapper)
        {
            _reportRepository = reportRepository;
            _mapper = mapper;
        }

        public async Task<List<GetMonthlyDetailsViewModel>> Handle(GetMonthlyDetailsQuery request, CancellationToken cancellationToken)
        {
            var reports = await _reportRepository.GetByYearAsync(request.Year);
            
            var reportViewModels = _mapper.Map<List<GetMonthlyDetailsViewModel>>(reports);
            
            return reportViewModels;
        }
    }
}