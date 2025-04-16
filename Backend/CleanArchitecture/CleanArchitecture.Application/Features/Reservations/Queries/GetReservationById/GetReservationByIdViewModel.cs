using System;

namespace CleanArchitecture.Core.Features.Reservations.Queries.GetReservationById
{
    public class GetReservationByIdViewModel
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; }
        
        public int RoomId { get; set; }
        public int RoomNumber { get; set; }
        public string RoomType { get; set; }
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int NumberOfGuests { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; }
        public int? Rating { get; set; }
    }
}