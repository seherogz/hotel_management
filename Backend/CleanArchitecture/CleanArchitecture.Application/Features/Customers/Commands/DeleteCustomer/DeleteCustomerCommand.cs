using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Customers.Commands.DeleteCustomer
{
    public class DeleteCustomerCommand : IRequest<int>
    {
        public int Id { get; set; }
    }

    public class DeleteCustomerCommandHandler : IRequestHandler<DeleteCustomerCommand, int>
    {
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IReservationRepositoryAsync _reservationRepository;

        public DeleteCustomerCommandHandler(
            ICustomerRepositoryAsync customerRepository,
            IReservationRepositoryAsync reservationRepository)
        {
            _customerRepository = customerRepository;
            _reservationRepository = reservationRepository;
        }

        public async Task<int> Handle(DeleteCustomerCommand request, CancellationToken cancellationToken)
        {
            var customer = await _customerRepository.GetByIdAsync(request.Id);
            
            if (customer == null)
            {
                throw new EntityNotFoundException("Customer", request.Id);
            }
            
            // Check if customer has any active reservations
            var customerReservations = await _reservationRepository.GetReservationsByCustomerIdAsync(request.Id);
            var hasActiveReservations = customerReservations.Any(r => 
                r.Status == "Pending" || r.Status == "Checked-in");
            
            if (hasActiveReservations)
            {
                throw new ValidationException("Cannot delete customer with active reservations.");
            }
            
            await _customerRepository.DeleteAsync(customer);
            
            return customer.Id;
        }
    }
}