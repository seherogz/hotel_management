using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetReservationById
{
    public class GetReservationByIdQuery : IRequest<GetReservationByIdViewModel>
    {
        public int Id { get; set; }
    }

    public class GetReservationByIdQueryHandler : IRequestHandler<GetReservationByIdQuery, GetReservationByIdViewModel>
    {
        private readonly IReservationRepositoryAsync _reservationRepository;
        private readonly IMapper _mapper;

        public GetReservationByIdQueryHandler(
            IReservationRepositoryAsync reservationRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<GetReservationByIdViewModel> Handle(GetReservationByIdQuery request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            
            if (reservation == null)
            {
                throw new EntityNotFoundException("Entity", request.Id);
            }
            
            var reservationViewModel = _mapper.Map<GetReservationByIdViewModel>(reservation);
            
            return reservationViewModel;
        }
    }
}