using CleanArchitecture.Core.Parameters;
using System;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetCheckOuts
{
    public class GetCheckOutsParameter : RequestParameter
    {
        public DateTime? CheckOutDate { get; set; }
        public string ReservationId { get; set; }
        public string CustomerName { get; set; }
    }
}