using CleanArchitecture.Core.Parameters;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms
{
    public class GetAllRoomsParameter : RequestParameter
    {
        public string RoomType { get; set; }
        public string Status { get; set; }
        public int? Floor { get; set; }
    }
}