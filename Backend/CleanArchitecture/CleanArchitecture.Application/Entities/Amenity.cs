using System.Collections.Generic;

namespace CleanArchitecture.Core.Entities
{
    public class Amenity : BaseEntity
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public bool IsActive { get; set; } = true;
        
        // Navigation propertie
        public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
    }
}