using System;

namespace CleanArchitecture.Core.Features.Staff.Queries.GetAllStaff
{
    public class GetAllStaffViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Position { get; set; } // Combination of Department and Role
        public string Department { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string Status { get; set; } // "Active" or "On Leave" based on IsActive
        public DateTime StartDate { get; set; }
    }
}