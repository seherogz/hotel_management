// Backend/CleanArchitecture/CleanArchitecture.Application/Features/Shifts/Queries/GetShiftsByStaff/GetShiftsByStaffQuery.cs

using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq; // <<< LINQ metotları için eklendi (GroupBy, OrderByDescending, FirstOrDefault)
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Entities; // Shift entity'si için

namespace CleanArchitecture.Core.Features.Shifts.Queries.GetShiftsByStaff
{
    // Query sınıfı aynı kalır
    public class GetShiftsByStaffQuery : IRequest<List<GetShiftsByStaffViewModel>>
    {
        public int StaffId { get; set; }
    }

    // Handler (GÜNCELLENDİ)
    public class GetShiftsByStaffQueryHandler : IRequestHandler<GetShiftsByStaffQuery, List<GetShiftsByStaffViewModel>>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IShiftRepositoryAsync _shiftRepository;
        private readonly IMapper _mapper;

        public GetShiftsByStaffQueryHandler(
            IStaffRepositoryAsync staffRepository,
            IShiftRepositoryAsync shiftRepository,
            IMapper mapper)
        {
            _staffRepository = staffRepository;
            _shiftRepository = shiftRepository;
            _mapper = mapper;
        }

        public async Task<List<GetShiftsByStaffViewModel>> Handle(GetShiftsByStaffQuery request, CancellationToken cancellationToken)
        {
            // Personel kontrolü (Aynı kalır)
            var staff = await _staffRepository.GetByIdAsync(request.StaffId);
            if (staff == null)
            {
                throw new EntityNotFoundException("Staff", request.StaffId);
            }

            // Personelin TÜM vardiyalarını çek (Aynı kalır)
            // Not: Repository zaten ShiftDay'e göre sıralıyor, bu sonraki adımda işe yarar.
            var allShifts = await _shiftRepository.GetShiftsByStaffIdAsync(request.StaffId);

            if (allShifts == null || !allShifts.Any())
            {
                // Eğer hiç vardiya yoksa boş liste döndür
                return new List<GetShiftsByStaffViewModel>();
            }

            // Haftanın günlerine göre grupla ve her gün için en SON kaydı seç
            var latestShiftsPerDay = allShifts
                .OrderByDescending(s => s.ShiftDay) // En son tarihe göre sırala (veya Created)
                .GroupBy(s => s.DayOfTheWeek)      // Haftanın gününe göre grupla
                .Select(g => g.First())            // Her grubun ilk elemanını al (en sonuncusu)
                .ToList();

            // Seçilen (en son) vardiyaları ViewModel'e map'le
            var shiftsViewModels = _mapper.Map<List<GetShiftsByStaffViewModel>>(latestShiftsPerDay);

            // İsteğe bağlı: Haftanın günlerine göre sırala (örn: Monday, Tuesday...)
            var dayOrder = new Dictionary<string, int>
            {
                {"Monday", 1}, {"Tuesday", 2}, {"Wednesday", 3}, {"Thursday", 4},
                {"Friday", 5}, {"Saturday", 6}, {"Sunday", 7}
            };
            shiftsViewModels = shiftsViewModels
                                .OrderBy(vm => dayOrder.ContainsKey(vm.DayOfTheWeek) ? dayOrder[vm.DayOfTheWeek] : 99)
                                .ToList();


            return shiftsViewModels;
        }
    }
}