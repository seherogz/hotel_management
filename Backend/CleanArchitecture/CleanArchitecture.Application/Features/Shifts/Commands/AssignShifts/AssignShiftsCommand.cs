// Backend/CleanArchitecture/CleanArchitecture.Application/Features/Shifts/Commands/AssignShifts/AssignShiftsCommand.cs
using AutoMapper; // Kaldırıldı veya Yorumlandı
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
// using System.Globalization; // Kaldırıldı veya Yorumlandı
using System.Linq;        // .Any() için
using System.Threading;
using System.Threading.Tasks;
// using CleanArchitecture.Core.Interfaces; // IDateTimeService (placeholder için gerekebilir ama sabit tarih kullanacağız)

namespace CleanArchitecture.Core.Features.Shifts.Commands.AssignShifts
{
    // ShiftDetail DTO sadece UI'ın göndereceği alanları içeriyor
    public class ShiftDetail
    {
        public string DayOfTheWeek { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }
    }

    // Command sınıfı (Değişiklik Yok)
    public class AssignShiftsCommand : IRequest<bool>
    {
        public int StaffId { get; set; }
        public List<ShiftDetail> Shifts { get; set; } // Haftalık şablon
    }

    // Handler (GÜNCELLENDİ - Placeholder Değerler Kullanıyor)
    public class AssignShiftsCommandHandler : IRequestHandler<AssignShiftsCommand, bool>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IShiftRepositoryAsync _shiftRepository;
        // private readonly IDateTimeService _dateTimeService; // Sabit tarih için gerekmiyor

        // Constructor güncellendi
        public AssignShiftsCommandHandler(
            IStaffRepositoryAsync staffRepository,
            IShiftRepositoryAsync shiftRepository)
            // IDateTimeService dateTimeService) // Kaldırıldı
        {
            _staffRepository = staffRepository;
            _shiftRepository = shiftRepository;
            // _dateTimeService = dateTimeService;
        }

        // Varsayılan Değerler (Placeholder)
        // Bu değerler, ShiftDay ve ShiftType non-nullable olduğu için atanmak zorunda.
        private static readonly DateTime PlaceholderShiftDate = new DateTime(1900, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        private const string PlaceholderShiftType = "Template"; // Veya "", "Standard" gibi başka bir varsayılan

        public async Task<bool> Handle(AssignShiftsCommand request, CancellationToken cancellationToken)
        {
            // 1. Personel kontrolü
            var staff = await _staffRepository.GetByIdAsync(request.StaffId);
            if (staff == null)
            {
                throw new EntityNotFoundException(nameof(Staff), request.StaffId);
            }

            // 2. Mevcut vardiyaları sil (Şablon tamamen üzerine yazılıyor)
            var existingShifts = await _shiftRepository.GetShiftsByStaffIdAsync(request.StaffId);
            if (existingShifts != null && existingShifts.Any())
            {
                 // Not: Eğer hem şablon (ShiftDay=Placeholder) hem de gerçek vardiyaları
                 // bir arada tutacaksanız, burada sadece placeholder olanları silmek daha doğru olabilir.
                 // Şimdilik tümünü siliyoruz.
                foreach (var shift in existingShifts)
                {
                    await _shiftRepository.DeleteAsync(shift);
                }
            }

            // 3. İstekten gelen yeni şablonu ekle
            if (request.Shifts != null)
            {
                foreach (var shiftDetail in request.Shifts)
                {
                    // Gerekli alan kontrolü
                    if (string.IsNullOrEmpty(shiftDetail.DayOfTheWeek) ||
                        shiftDetail.StartTime == default ||
                        shiftDetail.EndTime == default)
                    {
                        continue; // Eksik kaydı atla
                    }

                    // Yeni Shift entity'si oluştur - ShiftDay ve ShiftType için placeholder kullan
                    var shift = new Shift
                    {
                        StaffId = request.StaffId,
                        DayOfTheWeek = shiftDetail.DayOfTheWeek,
                        StartTime = shiftDetail.StartTime,
                        EndTime = shiftDetail.EndTime,

                        // Non-nullable alanlar için varsayılan değerler ata
                        ShiftDay = PlaceholderShiftDate, // Sabit tarih ata
                        ShiftType = PlaceholderShiftType  // Sabit tip ata
                    };

                    // Veritabanına ekle
                    await _shiftRepository.AddAsync(shift);
                }
            }

            return true;
        }
    }
}