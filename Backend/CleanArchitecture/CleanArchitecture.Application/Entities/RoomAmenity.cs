namespace CleanArchitecture.Core.Entities
{
    public class RoomAmenity
    {
        public int RoomId { get; set; }
        public Room Room { get; set; }
        
        public int AmenityId { get; set; }
        public Amenity Amenity { get; set; }
    }
}