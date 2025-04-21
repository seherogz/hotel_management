using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Shifts.Commands.AssignShifts
{
    public class ShiftDetail
    {
        public string DayOfTheWeek { get; set; }
        public string ShiftType { get; set; }
        public TimeSpan StartTime { get; set; } // <-- string'den TimeSpan'e değiştirildi
        public TimeSpan EndTime { get; set; }   // <-- string'den TimeSpan'e değiştirildi
        public string ShiftDate { get; set; }
    }

    public class AssignShiftsCommand : IRequest<bool>
    {
        public int StaffId { get; set; }
        public List<ShiftDetail> Shifts { get; set; }
    }

    public class AssignShiftsCommandHandler : IRequestHandler<AssignShiftsCommand, bool>
    {
        private readonly IStaffRepositoryAsync _staffRepository;
        private readonly IShiftRepositoryAsync _shiftRepository;
        private readonly IMapper _mapper;

        public AssignShiftsCommandHandler(
            IStaffRepositoryAsync staffRepository,
            IShiftRepositoryAsync shiftRepository,
            IMapper mapper)
        {
            _staffRepository = staffRepository;
            _shiftRepository = shiftRepository;
            _mapper = mapper;
        }

        public async Task<bool> Handle(AssignShiftsCommand request, CancellationToken cancellationToken)
        {
            // Validate staff exists
            var staff = await _staffRepository.GetByIdAsync(request.StaffId);
            if (staff == null)
            {
                throw new EntityNotFoundException("Staff", request.StaffId);
            }

            // Get existing shifts
            var existingShifts = await _shiftRepository.GetShiftsByStaffIdAsync(request.StaffId);
            
            // Remove existing shifts
            foreach (var shift in existingShifts)
            {
                await _shiftRepository.DeleteAsync(shift);
            }
            
            // Add new shifts
            foreach (var shiftDetail in request.Shifts)
            {
                if (string.IsNullOrEmpty(shiftDetail.DayOfTheWeek) || 
                    string.IsNullOrEmpty(shiftDetail.ShiftType) ||
                    string.IsNullOrEmpty(shiftDetail.ShiftDate))
                {
                    continue; // Skip incomplete shift entries
                }
                
                if (!DateTime.TryParseExact(shiftDetail.ShiftDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDate))
                {
                    throw new ValidationException($"Invalid date format for shift date '{shiftDetail.ShiftDate}'. Use yyyy-MM-dd format.");
                }
                
                DateTime shiftDayUtc = DateTime.SpecifyKind(parsedDate.Date, DateTimeKind.Utc);
                
                var shift = new Shift
                {
                    StaffId = request.StaffId,
                    DayOfTheWeek = shiftDetail.DayOfTheWeek,
                    ShiftType = shiftDetail.ShiftType,
                    StartTime = shiftDetail.StartTime,
                    EndTime = shiftDetail.EndTime,
                    ShiftDay = shiftDayUtc // This would be set properly in a real app based on the next occurrence of the day
                };
                
                await _shiftRepository.AddAsync(shift);
            }
            
            return true;
        }
    }
}