using System;
using System.Collections.Generic;

namespace CleanArchitecture.Core.Features.Staff.Queries.GetStaffById
{
    public class GetStaffByIdViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Department { get; set; }
        public string Role { get; set; }
        public DateTime StartDate { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public decimal Salary { get; set; }
        public string Status { get; set; }
        public List<ShiftViewModel> Shifts { get; set; } = new List<ShiftViewModel>();
    }

    public class ShiftViewModel
    {
        public int Id { get; set; }
        public string DayOfTheWeek { get; set; }
        public string ShiftType { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
    }
}