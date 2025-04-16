using CleanArchitecture.Core.Parameters;
using System;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAvailableRooms
{
    public class GetAvailableRoomsParameter : RequestParameter
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string RoomType { get; set; }
        public string Status { get; set; }
        public string[] Features { get; set; }
    }
}