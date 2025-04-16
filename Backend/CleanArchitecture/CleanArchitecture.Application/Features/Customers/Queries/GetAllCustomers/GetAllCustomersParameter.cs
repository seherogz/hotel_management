using CleanArchitecture.Core.Parameters;

namespace CleanArchitecture.Core.Features.Customers.Queries.GetAllCustomers
{
    public class GetAllCustomersParameter : RequestParameter
    {
        public string Status { get; set; }
    }
}