namespace CleanArchitecture.Core.Features.Reservations.DTOs
{
    public class CreateReservationResponse
    {
        public int Id { get; set; }
        public decimal CalculatedPrice { get; set; }
    }
}