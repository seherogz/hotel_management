// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetAllRooms/GetAllRoomsParameter.cs
using System;
using CleanArchitecture.Core.Parameters; // RequestParameter için

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms
{
    public class GetAllRoomsParameter : RequestParameter // RequestParameter'dan türetiliyor (PageNumber, PageSize için)
    {
        public string RoomType { get; set; }
        // public string Status { get; set; } // <<< KALDIRILDI
        public int? Floor { get; set; }
        public bool? IsOnMaintenance { get; set; } // <<< EKLENDİ
        public DateTime? AvailabilityStartDate { get; set; } // <<< EKLENDİ
        public DateTime? AvailabilityEndDate { get; set; }   // <<< EKLENDİ
        
    }
}