﻿namespace CleanArchitecture.Core.Features.Customers.Queries.GetAllCustomers
{
    public class GetAllCustomersViewModel
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Status { get; set; }
    }
}