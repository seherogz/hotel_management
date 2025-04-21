using AutoMapper;
using CleanArchitecture.Core.Entities; // Reservation için
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetReservationById
{
    // Query sınıfı aynı kalır
    public class GetReservationByIdQuery : IRequest<GetReservationByIdViewModel>
    {
        public int Id { get; set; }
    }

    // Handler sınıfı güncellendi
    public class GetReservationByIdQueryHandler : IRequestHandler<GetReservationByIdQuery, GetReservationByIdViewModel>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public GetReservationByIdQueryHandler(IReservationRepositoryAsync reservationRepository, IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        // Handle metodu güncellendi
        public async Task<GetReservationByIdViewModel> Handle(GetReservationByIdQuery request, CancellationToken cancellationToken)
        {
            // !!! DEĞİŞİKLİK: İlişkili verileri içeren yeni metodu çağır !!!
            var reservation = await _reservationRepository.GetReservationByIdWithDetailsAsync(request.Id);

            // Rezervasyon bulunamazsa hata fırlat
            if (reservation == null)
            {
                throw new EntityNotFoundException(nameof(Reservation), request.Id);
            }

            // AutoMapper ile ViewModel'e map'le
            // Artık reservation.Customer ve reservation.Room null olmayacağı için map'leme başarılı olacak
            var reservationViewModel = _mapper.Map<GetReservationByIdViewModel>(reservation);

            return reservationViewModel;
        }
    }
}