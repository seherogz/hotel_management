// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/MaintenanceIssues/Commands/AddMaintenanceIssue/AddMaintenanceIssueCommand.cs

using AutoMapper;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Interfaces; // <<< IDateTimeService için eklendi

namespace CleanArchitecture.Core.Features.MaintenanceIssues.Commands.AddMaintenanceIssue
{
    // Command sınıfı aynı kalır
    public class AddMaintenanceIssueCommand : IRequest<int>
    {
        public int RoomId { get; set; }
        public string IssueDescription { get; set; }
        public DateTime EstimatedCompletionDate { get; set; } // Bu istekten UTC olarak gelmeli (örn: 2025-05-07T09:00:00.000Z)
    }

    // Command Handler (GÜNCELLENDİ)
    public class AddMaintenanceIssueCommandHandler : IRequestHandler<AddMaintenanceIssueCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;
        private readonly IMaintenanceIssueRepositoryAsync _maintenanceIssueRepository;
        private readonly IMapper _mapper;
        private readonly IDateTimeService _dateTimeService; // <<< Bağımlılık eklendi

        // Constructor güncellendi
        public AddMaintenanceIssueCommandHandler(
            IRoomRepositoryAsync roomRepository,
            IMaintenanceIssueRepositoryAsync maintenanceIssueRepository,
            IMapper mapper,
            IDateTimeService dateTimeService) // <<< Bağımlılık eklendi
        {
            _roomRepository = roomRepository;
            _maintenanceIssueRepository = maintenanceIssueRepository;
            _mapper = mapper;
            _dateTimeService = dateTimeService; // <<< Atama eklendi
        }

        public async Task<int> Handle(AddMaintenanceIssueCommand request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.RoomId);

            if (room == null)
            {
                throw new EntityNotFoundException("Room", request.RoomId);
            }

            // AutoMapper ile request'i entity'e map et
            var maintenanceIssue = _mapper.Map<MaintenanceIssue>(request);

            // --- YENİ: Created alanını ayarla ---
            // Şu anki UTC zamanını al
            var nowUtc = _dateTimeService.NowUtc;
            // Sadece gün kısmını al ve saati 15:00:00 yap
            var createdDateUtc = nowUtc.Date.Add(new TimeSpan(15, 0, 0));
            // DateTimeKind'ın UTC olduğundan emin ol (Add metodu korur ama garantiye alalım)
            createdDateUtc = DateTime.SpecifyKind(createdDateUtc, DateTimeKind.Utc);

            maintenanceIssue.Created = createdDateUtc; // Hesaplanan değeri ata
            // --- YENİ: Created alanını ayarlama sonu ---

            // Opsiyonel: EstimatedCompletionDate'in de UTC olduğundan emin olmak isteyebiliriz.
            // İstemciden zaten UTC geliyorsa (sondaki Z gibi) sorun olmaz.
            // Gelmiyorsa veya emin değilsek:
            if (maintenanceIssue.EstimatedCompletionDate.Kind == DateTimeKind.Unspecified) {
                 maintenanceIssue.EstimatedCompletionDate = DateTime.SpecifyKind(maintenanceIssue.EstimatedCompletionDate, DateTimeKind.Utc);
            } else if (maintenanceIssue.EstimatedCompletionDate.Kind == DateTimeKind.Local) {
                 maintenanceIssue.EstimatedCompletionDate = maintenanceIssue.EstimatedCompletionDate.ToUniversalTime();
            }
            // ---

            // Veritabanına ekle
            await _maintenanceIssueRepository.AddAsync(maintenanceIssue);

            return maintenanceIssue.Id;
        }
    }
}