using CleanArchitecture.Core.Parameters;
using System;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetCheckIns
{
    public class GetCheckInsParameter : RequestParameter
    {
        public DateTime? CheckInDate { get; set; }
        public string ReservationId { get; set; }
        public string CustomerName { get; set; }
    }
}