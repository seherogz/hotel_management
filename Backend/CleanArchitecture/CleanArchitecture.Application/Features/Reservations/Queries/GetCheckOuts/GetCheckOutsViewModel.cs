using System;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetCheckOuts
{
    public class GetCheckOutsViewModel
    {
        public int ReservationId { get; set; }
        public string CustomerName { get; set; }
        public string RoomInfo { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public string Status { get; set; }
    }
}