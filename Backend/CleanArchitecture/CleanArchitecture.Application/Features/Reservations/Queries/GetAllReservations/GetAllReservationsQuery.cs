using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetAllReservations
{
    // Query sınıfı aynı kalır
    public class GetAllReservationsQuery : IRequest<PagedResponse<GetAllReservationsViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public string Status { get; set; }
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        public int? CustomerId { get; set; }
        public int? RoomId { get; set; }
    }

    // Handler sınıfı güncellendi
    public class GetAllReservationsQueryHandler : IRequestHandler<GetAllReservationsQuery, PagedResponse<GetAllReservationsViewModel>>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public GetAllReservationsQueryHandler(
            IReservationRepositoryAsync reservationRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetAllReservationsViewModel>> Handle(GetAllReservationsQuery request, CancellationToken cancellationToken)
        {
            // İlişkili verileri yüklenmiş Reservation listesini tutacak değişken
            IReadOnlyList<Entities.Reservation> reservationsData;
            int totalRecords; // Toplam kayıt sayısını tutmak için

            // Filtreleri uygula ve veriyi çek
            if (request.CheckInDate.HasValue && request.CheckOutDate.HasValue)
            {
                reservationsData = await _reservationRepository.GetReservationsByDateRangeAsync(request.CheckInDate.Value, request.CheckOutDate.Value);
                totalRecords = reservationsData.Count;
            }
            else if (!string.IsNullOrEmpty(request.Status))
            {
                reservationsData = await _reservationRepository.GetReservationsByStatusAsync(request.Status);
                totalRecords = reservationsData.Count;
            }
            else if (request.CustomerId.HasValue)
            {
                reservationsData = await _reservationRepository.GetReservationsByCustomerIdAsync(request.CustomerId.Value);
                totalRecords = reservationsData.Count;
            }
            else if (request.RoomId.HasValue)
            {
                reservationsData = await _reservationRepository.GetReservationsByRoomIdAsync(request.RoomId.Value);
                totalRecords = reservationsData.Count;
            }
            else
            {
                // Filtre yoksa, sayfalanmış ve ilişkili verileri içeren yeni metodu kullan
                var pagedResult = await _reservationRepository.GetPagedReservationsWithDetailsAsync(request.PageNumber, request.PageSize);
                reservationsData = pagedResult.data;
                totalRecords = pagedResult.totalCount; // Toplam sayıyı doğrudan al
            }

            // Filtreli durumlarda çekilen tüm veriden sayfalama yap
            // (Not: Büyük veri setlerinde bu verimsiz olabilir, filtrelemeyi ve sayfalamayı birleştirmek daha iyidir)
            List<Entities.Reservation> pagedDataToMap;
            if (request.CheckInDate.HasValue || !string.IsNullOrEmpty(request.Status) || request.CustomerId.HasValue || request.RoomId.HasValue)
            {
                 // Filtreli ise, bellekte sayfalama yap
                 pagedDataToMap = reservationsData
                    .Skip((request.PageNumber - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToList();
            }
            else
            {
                // Filtresiz durumda zaten sayfalama yapıldı
                pagedDataToMap = reservationsData.ToList();
            }

            // AutoMapper ile ViewModel'e dönüştür
            // Artık Customer ve Room bilgileri de geldiği için CustomerName, RoomNumber, RoomType maplenecek.
            var reservationViewModels = _mapper.Map<List<GetAllReservationsViewModel>>(pagedDataToMap);

            // MANUEL EŞLEŞTİRME DÖNGÜSÜNE GEREK YOK, KALDIRILDI.

            // PagedResponse'u döndür
            return new PagedResponse<GetAllReservationsViewModel>(
                reservationViewModels, request.PageNumber, request.PageSize, totalRecords); // Toplam kayıt sayısı kullanıldı
        }
    }
}