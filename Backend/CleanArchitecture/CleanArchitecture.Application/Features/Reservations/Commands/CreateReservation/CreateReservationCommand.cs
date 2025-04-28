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
using CleanArchitecture.Core.Features.Reservations.DTOs;
using ValidationException = CleanArchitecture.Core.Exceptions.ValidationException;
// using Microsoft.Extensions.Configuration; // KALDIRILDI
// using Microsoft.Extensions.Options; // KALDIRILDI
// using CleanArchitecture.Core.Settings;  // KALDIRILDI
using CleanArchitecture.Core.Interfaces; // Opsiyonel (IDateTimeService vb. için)

namespace CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation
{
    // Command sınıfı aynı
    public class CreateReservationCommand : IRequest<CreateReservationResponse>
    {
        [Required(ErrorMessage = "Müşteri kimlik numarası gereklidir.")]
        public string CustomerIdNumber { get; set; }
        public int RoomId { get; set; }
        public DateTime StartDate { get; set; } // Kullanıcının seçtiği tarih (saat kısmı yok sayılacak)
        public DateTime EndDate { get; set; }   // Kullanıcının seçtiği tarih (saat kısmı yok sayılacak)
        public int NumberOfGuests { get; set; }
    }

    public class CreateReservationCommandHandler : IRequestHandler<CreateReservationCommand, CreateReservationResponse>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly ICustomerRepositoryAsync _customerRepository;
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMapper _mapper;
        // IConfiguration veya IOptions bağımlılığı YOK

        // Constructor güncellendi: IConfiguration/IOptions yok
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

        public async Task<CreateReservationResponse> Handle(CreateReservationCommand request, CancellationToken cancellationToken)
        {
            // --- Müşteri, Oda, Bakım Kontrolleri ---
            var customer = await _customerRepository.GetByIdNumberAsync(request.CustomerIdNumber);
            if (customer == null) throw new ValidationException($"Customer with ID number '{request.CustomerIdNumber}' not found.");

            var room = await _roomRepository.GetByIdAsync(request.RoomId);
            if (room == null) throw new EntityNotFoundException("Room", request.RoomId);
            if (room.IsOnMaintenance) throw new ValidationException("Cannot reserve a room under maintenance.");
            // --- Kontroller Sonu ---

            // --- Başlangıç ve Bitiş Saatlerini Ayarla (Doğrudan UTC olarak) ---
            DateTime startDateUtc;
            DateTime endDateUtc;
            try
            {
                // Kullanıcının girdiği tarihin gününü al, saati 15:00 yap, türünü UTC olarak belirt
                startDateUtc = DateTime.SpecifyKind(
                    request.StartDate.Date.Add(new TimeSpan(15, 0, 0)),
                    DateTimeKind.Utc
                 );
                // Kullanıcının girdiği tarihin gününü al, saati 09:00 yap, türünü UTC olarak belirt
                 endDateUtc = DateTime.SpecifyKind(
                    request.EndDate.Date.Add(new TimeSpan(9, 0, 0)),
                    DateTimeKind.Utc
                 );
            }
             catch (ArgumentOutOfRangeException ex) {
                 // Eğer gelen tarih çok büyük/küçükse bu hata oluşabilir
                 throw new ValidationException($"Invalid StartDate or EndDate provided. Potential overflow/underflow. Details: {ex.Message}");            }

            // Bitiş tarihinin başlangıçtan sonra olduğunu kontrol et
            if (endDateUtc <= startDateUtc)
            {
                throw new ValidationException("End date/time (09:00 UTC) must be after the start date/time (15:00 UTC). Check your selected dates.");
            }
            // --- Saat Ayarlama Sonu ---

            // --- Oda Müsaitlik Kontrolü (Ayarlanmış UTC saatlerine göre) ---
            var isAvailable = await _reservationRepository.IsRoomAvailableAsync(request.RoomId, startDateUtc, endDateUtc);
            if (!isAvailable)
            {
                throw new ValidationException("The selected room is not available for the specified dates.");
            }
            // --- Müsaitlik Kontrolü Sonu ---

            // Rezervasyonu oluştur
            var reservation = new Reservation
            {
                 CustomerId = customer.Id,
                 RoomId = request.RoomId,
                 StartDate = startDateUtc, // Ayarlanmış UTC saati
                 EndDate = endDateUtc,     // Ayarlanmış UTC saati
                 NumberOfGuests = request.NumberOfGuests,
                 Status = "Pending",
                 Created = DateTime.UtcNow
            };

            // --- Fiyat Hesaplama (Gece sayısına göre - Değişiklik yok) ---
            int numberOfNights = (int)(request.EndDate.Date - request.StartDate.Date).TotalDays;
            if (numberOfNights <= 0) throw new ValidationException("Reservation must be for at least one night.");
            reservation.Price = room.PricePerNight * numberOfNights;
            // --- Fiyat Hesaplama Sonu ---

            await _reservationRepository.AddAsync(reservation);

            return new CreateReservationResponse
            {
                Id = reservation.Id,
                CalculatedPrice = reservation.Price
            };
        }
    }
}