using System;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetAllReservations
{
    public class GetAllReservationsViewModel
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        
        public int RoomId { get; set; }
        public int RoomNumber { get; set; }
        public string RoomType { get; set; }
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; }
    }
}