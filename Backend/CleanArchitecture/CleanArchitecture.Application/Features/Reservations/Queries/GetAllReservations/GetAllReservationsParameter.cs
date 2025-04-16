using CleanArchitecture.Core.Parameters;
using System;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetAllReservations
{
    public class GetAllReservationsParameter : RequestParameter
    {
        public string Status { get; set; }
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        public int? CustomerId { get; set; }
        public int? RoomId { get; set; }
    }
}