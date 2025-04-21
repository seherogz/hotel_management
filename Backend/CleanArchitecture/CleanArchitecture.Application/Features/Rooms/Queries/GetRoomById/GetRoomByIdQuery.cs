// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Rooms/Queries/GetRoomById/GetRoomByIdQuery.cs
using System;
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces;
using CleanArchitecture.Core.Interfaces; // IApplicationDbContext, IDateTimeService için
using Microsoft.EntityFrameworkCore;

namespace CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById
{
    // Query Sınıfı
    public class GetRoomByIdQuery : IRequest<GetRoomByIdViewModel>
    {
        public int Id { get; set; }
        public DateTime? StatusCheckDate { get; set; } // Hangi tarih için durum hesaplanacak?
    }

    // Query Handler Sınıfı
    public class GetRoomByIdQueryHandler : IRequestHandler<GetRoomByIdQuery, GetRoomByIdViewModel>
    {
        private readonly IApplicationDbContext _context; // DbContext kullanıyoruz
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService;
        // Amenity ve MaintenanceIssue için ayrı repository'lere gerek yok, context yeterli.

        public GetRoomByIdQueryHandler(
            IApplicationDbContext context,
            IMapper mapper,
            IDateTimeService dateTimeService)
        {
             _context = context;
             _mapper = mapper;
             _dateTimeService = dateTimeService;
        }

        public async Task<GetRoomByIdViewModel> Handle(GetRoomByIdQuery request, CancellationToken cancellationToken)
        {
            // Durumu hesaplamak için ilişkili verileri (Amenities, MaintenanceIssues, Reservations) çekmeliyiz.
            var room = await _context.Rooms
                .Include(r => r.Amenities)
                .Include(r => r.MaintenanceIssues)
                // İlgili rezervasyonları çek (Aktif veya Bekleyen)
                .Include(r => r.Reservations.Where(res => res.Status == "Pending" || res.Status == "Checked-in"))
                .AsNoTracking() // Detay sorgusu, izlemeye gerek yok
                .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.Id);
            }

            // Temel özellikleri map'le (ViewModel'da Status yok, IsOnMaintenance ve ComputedStatus var)
            var roomViewModel = _mapper.Map<GetRoomByIdViewModel>(room);

            // Özellikler (Amenities) - AutoMapper map'lememişse manuel yap (GeneralProfile'a bağlı)
            // Bu map'leme GeneralProfile'da Ignore edildiği için manuel doldurma doğru.
            roomViewModel.Features = room.Amenities?.Select(a => a.Name).ToList() ?? new List<string>();

            // Bakım Detayları - AutoMapper map'lememişse manuel yap
            roomViewModel.MaintenanceDetails = _mapper.Map<List<MaintenanceIssueViewModel>>(room.MaintenanceIssues) ?? new List<MaintenanceIssueViewModel>();

            // Bakım Durumu (AutoMapper ile map edilmiş olmalı)
            // roomViewModel.IsOnMaintenance = room.IsOnMaintenance;

            // Dinamik Durum Hesaplama
            var statusCheckDate = request.StatusCheckDate?.Date ?? _dateTimeService.NowUtc.Date;
            roomViewModel.ComputedStatus = CalculateRoomStatus(room, statusCheckDate);
            roomViewModel.StatusCheckDate = statusCheckDate;

            return roomViewModel;
        }

         // Oda durumunu hesaplayan yardımcı metot (GetAllRoomsQueryHandler ile aynı)
        private string CalculateRoomStatus(Room room, DateTime checkDate)
        {
            if (room.IsOnMaintenance)
            {
                return "Maintenance";
            }

            // Include ile çekilen, filtrelenmiş (Pending veya Checked-in) rezervasyonları kullan
            var relevantReservation = room.Reservations
                .FirstOrDefault(res =>
                    res.StartDate.Date <= checkDate &&
                    res.EndDate.Date > checkDate);

            if (relevantReservation != null)
            {
                 if (relevantReservation.Status == "Checked-in")
                 {
                      return "Occupied";
                 }
            }
            return "Available";
        }
    }
}