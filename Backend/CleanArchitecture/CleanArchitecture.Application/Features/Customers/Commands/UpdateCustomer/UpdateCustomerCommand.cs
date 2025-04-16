using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Customers.Commands.UpdateCustomer
{
    public class UpdateCustomerCommand : IRequest<int>
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Status { get; set; }
        public string Nationality { get; set; }
        public string IdNumber { get; set; }
        public string Notes { get; set; }
        public DateTime BirthDate { get; set; }
    }

    public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand, int>
    {
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IMapper _mapper;

        public UpdateCustomerCommandHandler(
            ICustomerRepositoryAsync customerRepository,
            IMapper mapper)
        {
            _customerRepository = customerRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
        {
            var customer = await _customerRepository.GetByIdAsync(request.Id);
            
            if (customer == null)
            {
                throw new EntityNotFoundException("Entity", request.Id);
            }

            // Check if email is being changed and if it's unique
            if (customer.Email != request.Email)
            {
                var isEmailUnique = await _customerRepository.IsUniqueEmailAsync(request.Email);
                if (!isEmailUnique)
                {
                    throw new ValidationException($"Email {request.Email} is already in use.");
                }
            }

            // Check if phone is being changed and if it's unique
            if (customer.Phone != request.Phone)
            {
                var isPhoneUnique = await _customerRepository.IsUniquePhoneAsync(request.Phone);
                if (!isPhoneUnique)
                {
                    throw new ValidationException($"Phone {request.Phone} is already in use.");
                }
            }

            // Update customer properties
            customer.FirstName = request.FirstName;
            customer.LastName = request.LastName;
            customer.Email = request.Email;
            customer.Phone = request.Phone;
            customer.Address = request.Address;
            customer.Status = request.Status;
            customer.Nationality = request.Nationality;
            customer.IdNumber = request.IdNumber;
            customer.Notes = request.Notes;
            customer.BirthDate = request.BirthDate;

            await _customerRepository.UpdateAsync(customer);
            
            return customer.Id;
        }
    }
}