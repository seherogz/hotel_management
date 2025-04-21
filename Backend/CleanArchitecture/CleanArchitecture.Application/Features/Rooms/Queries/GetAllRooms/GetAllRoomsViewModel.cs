// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetAllRooms/GetAllRoomsViewModel.cs
using System;
using System.Collections.Generic;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms
{
    public class GetAllRoomsViewModel
    {
        public int Id { get; set; }
        public int RoomNumber { get; set; }
        public string RoomType { get; set; }
        public int Floor { get; set; }
        public string Capacity { get; set; }
        public decimal PricePerNight { get; set; }
        public bool IsOnMaintenance { get; set; } // Bu alan var
        public string ComputedStatus { get; set; } // Bu alan var
        public string Description { get; set; }
        public List<string> Features { get; set; } = new List<string>();
        public DateTime? StatusCheckDate { get; set; } // Bu alan var
    }
}