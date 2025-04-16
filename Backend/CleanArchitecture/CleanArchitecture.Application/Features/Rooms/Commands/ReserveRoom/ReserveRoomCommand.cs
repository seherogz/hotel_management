using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Rooms.Commands.ReserveRoom
{
    public class ReserveRoomCommand : IRequest<int>
    {
        public int RoomId { get; set; }
        public string GuestName { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
    }

    public class ReserveRoomCommandHandler : IRequestHandler<ReserveRoomCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public ReserveRoomCommandHandler(
            IRoomRepositoryAsync roomRepository,
            ICustomerRepositoryAsync customerRepository,
            IReservationRepositoryAsync reservationRepository,
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _customerRepository = customerRepository;
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(ReserveRoomCommand request, CancellationToken cancellationToken)
        {
            // Check if room exists
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null)
            {
                throw new Exception($"Room with ID {request.RoomId} not found.");
            }

            // Check if room is available
            var isAvailable = await _reservationRepository.IsRoomAvailableAsync(
                request.RoomId, request.CheckInDate, request.CheckOutDate);
            
            if (!isAvailable || room.Status != "available")
            {
                throw new Exception("Room is not available for the selected dates.");
            }

            // Find or create the customer
            var fullName = request.GuestName.Split(' ');
            var firstName = fullName[0];
            var lastName = fullName.Length > 1 ? string.Join(" ", fullName.Skip(1)) : "";
            
            var customer = (await _customerRepository.GetAllAsync())
                .FirstOrDefault(c => 
                    c.FirstName == firstName && 
                    c.LastName == lastName);
            
            if (customer == null)
            {
                // Create a new customer
                customer = new Customer
                {
                    FirstName = firstName,
                    LastName = lastName,
                    Email = $"{firstName.ToLower()}.{lastName.ToLower()}@example.com", // Placeholder
                    Status = "Standard"
                };
                
                await _customerRepository.AddAsync(customer);
            }

            // Create the reservation
            var reservation = new Reservation
            {
                CustomerId = customer.Id,
                RoomId = room.Id,
                StartDate = request.CheckInDate,
                EndDate = request.CheckOutDate,
                NumberOfGuests = int.Parse(room.Capacity.Split(' ')[0]), // Extract number from "X kişilik"
                Price = room.PricePerNight * (request.CheckOutDate - request.CheckInDate).Days,
                Status = "Pending"
            };
            
            await _reservationRepository.AddAsync(reservation);
            
            return reservation.Id;
        }
    }
}