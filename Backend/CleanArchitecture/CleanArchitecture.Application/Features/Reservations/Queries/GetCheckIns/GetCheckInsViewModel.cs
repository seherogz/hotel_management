using System;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetCheckIns
{
    public class GetCheckInsViewModel
    {
        public int ReservationId { get; set; }
        public string CustomerName { get; set; }
        public string RoomInfo { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public string Status { get; set; }
    }
}