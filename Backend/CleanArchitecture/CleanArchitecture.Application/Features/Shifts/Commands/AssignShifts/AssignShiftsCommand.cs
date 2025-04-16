using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Shifts.Commands.AssignShifts
{
    public class ShiftDetail
    {
        public string DayOfTheWeek { get; set; }
        public string ShiftType { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
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
                    string.IsNullOrEmpty(shiftDetail.StartTime) ||
                    string.IsNullOrEmpty(shiftDetail.EndTime))
                {
                    continue; // Skip incomplete shift entries
                }
                
                // Convert time strings to TimeSpan
                if (!TimeSpan.TryParse(shiftDetail.StartTime, out TimeSpan startTime) ||
                    !TimeSpan.TryParse(shiftDetail.EndTime, out TimeSpan endTime))
                {
                    throw new ValidationException($"Invalid time format. Use HH:MM format.");
                }
                
                var shift = new Shift
                {
                    StaffId = request.StaffId,
                    DayOfTheWeek = shiftDetail.DayOfTheWeek,
                    ShiftType = shiftDetail.ShiftType,
                    StartTime = startTime,
                    EndTime = endTime,
                    ShiftDay = DateTime.Now // This would be set properly in a real app based on the next occurrence of the day
                };
                
                await _shiftRepository.AddAsync(shift);
            }
            
            return true;
        }
    }
}