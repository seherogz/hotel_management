namespace CleanArchitecture.Core.Features.Shifts.Queries.GetShiftsByStaff
{
    public class GetShiftsByStaffViewModel
    {
        public int Id { get; set; }
        public string DayOfTheWeek { get; set; }
        public string StartTime { get; set; }
        public string EndTime { get; set; }
        
    }
}