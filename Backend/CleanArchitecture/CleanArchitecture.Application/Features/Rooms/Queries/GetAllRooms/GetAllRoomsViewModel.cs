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
        
        public string? OccupantName { get; set; } // O anki misafirin adı (null olabilir)
        public int? CurrentReservationId { get; set; } // O anki rezervasyon ID'si (null olabilir)
        public DateTime? OccupantCheckInDate { get; set; } // O anki misafirin giriş tarihi (null olabilir)
        public DateTime? OccupantCheckOutDate { get; set; }
    }
}