using CleanArchitecture.Core.Parameters;

namespace CleanArchitecture.Core.Features.Staff.Queries.GetAllStaff
{
    public class GetAllStaffParameter : RequestParameter
    {
        public string Department { get; set; }
        public string Role { get; set; }
        public bool? IsActive { get; set; }
    }
}