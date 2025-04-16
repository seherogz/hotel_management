using AutoMapper;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Wrappers;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces;
using Microsoft.EntityFrameworkCore; // Include için

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms
{
    public class GetAllRoomsQuery : IRequest<PagedResponse<GetAllRoomsViewModel>>
    {
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public string RoomType { get; set; }
        public string Status { get; set; }
        public int? Floor { get; set; }
    }

    public class GetAllRoomsQueryHandler : IRequestHandler<GetAllRoomsQuery, PagedResponse<GetAllRoomsViewModel>>
    {
        // IRoomRepositoryAsync yerine doğrudan DbContext kullanmak daha esnek olabilir
        // veya Repository'e IQueryable döndüren bir metot eklemek gerekebilir.
        // Şimdilik Repository'deki GetPagedReponseAsync'i kullanıp sonra Include yapalım.
        // Daha iyi bir çözüm için Specification Pattern düşünülebilir.
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IAmenityRepositoryAsync _amenityRepository; // Bu artık gerekmeyebilir
         private readonly IApplicationDbContext _context; // DbContext'i ekleyelim
        private readonly IMapper _mapper;

        public GetAllRoomsQueryHandler(
            IRoomRepositoryAsync roomRepository,
            IAmenityRepositoryAsync amenityRepository, // Kaldırılabilir
            IApplicationDbContext context, // Eklendi
            IMapper mapper)
        {
            _roomRepository = roomRepository;
            _amenityRepository = amenityRepository; // Kaldırılabilir
            _context = context; // Eklendi
            _mapper = mapper;
        }

        public async Task<PagedResponse<GetAllRoomsViewModel>> Handle(GetAllRoomsQuery request, CancellationToken cancellationToken)
        {
            // IQueryable oluştur
            var query = _context.Rooms.Include(r => r.Amenities).AsQueryable(); // Include Amenities

            // Filtreleri uygula
            if (!string.IsNullOrEmpty(request.RoomType))
            {
                query = query.Where(r => r.RoomType == request.RoomType);
            }
            if (!string.IsNullOrEmpty(request.Status))
            {
                query = query.Where(r => r.Status == request.Status);
            }
            if (request.Floor.HasValue)
            {
                query = query.Where(r => r.Floor == request.Floor.Value);
            }

            // Toplam sayıyı al (sayfalama öncesi)
            var totalRecords = await query.CountAsync(cancellationToken);

            // Sayfalamayı uygula
            var pagedData = await query
                .Skip((request.PageNumber - 1) * request.PageSize)
                .Take(request.PageSize)
                .AsNoTracking() // Okuma işlemi için
                .ToListAsync(cancellationToken);

            // ViewModel'e map et
            // AutoMapper profilinin Room -> GetAllRoomsViewModel için Amenity'leri map etmesi GEREKMEZ.
            // Çünkü Amenities zaten Room nesnesinde yüklü. ViewModel'de Features listesi var.
             var roomViewModels = _mapper.Map<List<GetAllRoomsViewModel>>(pagedData);

             // Eğer AutoMapper Amenity listesini otomatik map etmiyorsa, manuel yap:
             foreach (var viewModel in roomViewModels)
             {
                 var roomEntity = pagedData.FirstOrDefault(r => r.Id == viewModel.Id);
                 if (roomEntity?.Amenities != null)
                 {
                     viewModel.Features = roomEntity.Amenities.Select(a => a.Name).ToList();
                 }
             }


            return new PagedResponse<GetAllRoomsViewModel>(roomViewModels, request.PageNumber, request.PageSize, totalRecords);
        }
    }
}