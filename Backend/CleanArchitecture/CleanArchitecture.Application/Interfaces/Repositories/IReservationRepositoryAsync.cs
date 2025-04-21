using CleanArchitecture.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Interfaces.Repositories
{
    // IGenericRepositoryAsync<Reservation> arayüzünden miras alır
    public interface IReservationRepositoryAsync : IGenericRepositoryAsync<Reservation>
    {
        // Mevcut metot imzaları (bunlar zaten olmalı)
        Task<IReadOnlyList<Reservation>> GetReservationsByCustomerIdAsync(int customerId);
        Task<IReadOnlyList<Reservation>> GetReservationsByRoomIdAsync(int roomId);
        Task<IReadOnlyList<Reservation>> GetReservationsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<IReadOnlyList<Reservation>> GetReservationsByStatusAsync(string status);
        Task<bool> IsRoomAvailableAsync(int roomId, DateTime startDate, DateTime endDate, int? excludeReservationId = null);

        // Sayfalı listeleme için eklenen metot imzası (önceki adımdan)
        Task<(IReadOnlyList<Reservation> data, int totalCount)> GetPagedReservationsWithDetailsAsync(int pageNumber, int pageSize);

        // !!! ID İLE GETİRME İÇİN YENİ EKLENEN METOT İMZASI !!!
        Task<Reservation> GetReservationByIdWithDetailsAsync(int id);
    }
}