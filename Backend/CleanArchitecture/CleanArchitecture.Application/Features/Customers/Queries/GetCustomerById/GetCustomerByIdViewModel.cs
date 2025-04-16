using System;
using System.Collections.Generic;

namespace CleanArchitecture.Core.Features.Customers.Queries.GetCustomerById
{
    public class GetCustomerByIdViewModel
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Status { get; set; }
        public string Nationality { get; set; }
        public string IdNumber { get; set; }
        public string Notes { get; set; }
        public DateTime BirthDate { get; set; }
        public decimal TotalSpending { get; set; }
        public List<ReservationHistoryViewModel> Reservations { get; set; } = new List<ReservationHistoryViewModel>();
    }

    public class ReservationHistoryViewModel
    {
        public int Id { get; set; }
        public int RoomNumber { get; set; }
        public string RoomType { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; }
        public int? Rating { get; set; }
    }
}