// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Reservations/Commands/CreateReservation/CreateReservationCommand.cs
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using ValidationException = CleanArchitecture.Core.Exceptions.ValidationException;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation
{
    public class CreateReservationCommand : IRequest<int>
    {
        [Required(ErrorMessage = "Müşteri kimlik numarası gereklidir.")]
        public string CustomerIdNumber { get; set; } // Use ID number to find customer

        public int RoomId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int NumberOfGuests { get; set; }
        public decimal Price { get; set; }
        // Status default "Pending" olacak, command'da belirtmeye gerek yok.
    }

    public class CreateReservationCommandHandler : IRequestHandler<CreateReservationCommand, int>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMapper _mapper;

        public CreateReservationCommandHandler(
            IReservationRepositoryAsync reservationRepository,
            ICustomerRepositoryAsync customerRepository,
            IRoomRepositoryAsync roomRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _customerRepository = customerRepository;
            _roomRepository = roomRepository;
            _mapper = mapper;
        }

        public async Task<int> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
        {
            // Müşteriyi ID numarasına göre bul
            var customer = await _customerRepository.GetByIdNumberAsync(request.CustomerIdNumber);
            if (customer == null)
            {
                // Veya EntityNotFoundException da olabilir
                throw new ValidationException($"Customer with ID number '{request.CustomerIdNumber}' not found. Please create the customer first.");
            }

            // Odayı bul
            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }

            // Oda bakımda mı kontrolü
            if (room.IsOnMaintenance)
            {
                 throw new ValidationException("Cannot make a reservation for a room that is under maintenance.");
            }

            // Seçilen tarihlerde oda müsait mi?
            var isAvailable = await _reservationRepository.IsRoomAvailableAsync(
                request.RoomId, request.StartDate, request.EndDate);

            if (!isAvailable)
            {
                throw new ValidationException("The selected room is not available for the specified date range.");
            }

            // Rezervasyonu oluştur
            var reservation = _mapper.Map<Reservation>(request);
            reservation.CustomerId = customer.Id; // Müşteri ID'sini ata
            reservation.Status = "Pending"; // Durumu Pending olarak ayarla

            await _reservationRepository.AddAsync(reservation);

            return reservation.Id;
        }
    }
}