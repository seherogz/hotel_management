using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Customers.Queries.GetCustomerById
{
    public class GetCustomerByIdQuery : IRequest<GetCustomerByIdViewModel>
    {
        public int Id { get; set; }
    }

    public class GetCustomerByIdQueryHandler : IRequestHandler<GetCustomerByIdQuery, GetCustomerByIdViewModel>
    {
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public GetCustomerByIdQueryHandler(
            ICustomerRepositoryAsync customerRepository,
            IReservationRepositoryAsync reservationRepository,
            IMapper mapper)
        {
            _customerRepository = customerRepository;
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<GetCustomerByIdViewModel> Handle(GetCustomerByIdQuery request, CancellationToken cancellationToken)
        {
            var customer = await _customerRepository.GetByIdAsync(request.Id);
            
            if (customer == null)
            {
                throw new EntityNotFoundException("Customer", request.Id);
            }
            
            var customerViewModel = _mapper.Map<GetCustomerByIdViewModel>(customer);
            customerViewModel.FullName = $"{customer.FirstName} {customer.LastName}";
            
            // Get customer's reservation history
            var reservations = await _reservationRepository.GetReservationsByCustomerIdAsync(request.Id);
            customerViewModel.Reservations = _mapper.Map<List<ReservationHistoryViewModel>>(reservations);
            
            // Calculate total spending
            customerViewModel.TotalSpending = 0;
            foreach (var reservation in reservations)
            {
                // Only include completed and checked-in reservations
                if (reservation.Status == "Completed" || reservation.Status == "Checked-in")
                {
                    customerViewModel.TotalSpending += reservation.Price;
                }
            }
            
            return customerViewModel;
        }
    }
}