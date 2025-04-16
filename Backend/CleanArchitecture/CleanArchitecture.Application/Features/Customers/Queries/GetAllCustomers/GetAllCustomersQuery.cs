using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Customers.Queries.GetAllCustomers
{
    public class GetAllCustomersQuery : IRequest<PagedResponse<GetAllCustomersViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public string Status { get; set; }
    }

    public class GetAllCustomersQueryHandler : IRequestHandler<GetAllCustomersQuery, PagedResponse<GetAllCustomersViewModel>>
    {
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IMapper _mapper;

        public GetAllCustomersQueryHandler(
            ICustomerRepositoryAsync customerRepository,
            IMapper mapper)
        {
            _customerRepository = customerRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetAllCustomersViewModel>> Handle(GetAllCustomersQuery request, CancellationToken cancellationToken)
        {
            var customers = await _customerRepository.GetPagedReponseAsync(request.PageNumber, request.PageSize);
            
            // Filter by status if provided
            if (!string.IsNullOrEmpty(request.Status))
            {
                customers = customers.Where(c => c.Status == request.Status).ToList();
            }
            
            var customerViewModels = new List<GetAllCustomersViewModel>();
            
            foreach (var customer in customers)
            {
                var viewModel = _mapper.Map<GetAllCustomersViewModel>(customer);
                viewModel.FullName = $"{customer.FirstName} {customer.LastName}";
                customerViewModels.Add(viewModel);
            }
            
            return new PagedResponse<GetAllCustomersViewModel>(customerViewModels, request.PageNumber, request.PageSize, customerViewModels.Count);
        }
    }
}