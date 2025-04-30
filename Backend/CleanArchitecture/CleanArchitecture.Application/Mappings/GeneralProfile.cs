// File: Backend/CleanArchitecture/CleanArchitecture.Application/Mappings/GeneralProfile.cs
using AutoMapper;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Features.Amenities.Queries.GetRoomAmenities;
using CleanArchitecture.Core.Features.MaintenanceIssues.Commands.AddMaintenanceIssue;
using CleanArchitecture.Core.Features.MaintenanceIssues.Queries.GetMaintenanceIssuesByRoom;
using CleanArchitecture.Core.Features.Rooms.Commands.CreateRoom;
using CleanArchitecture.Core.Features.Rooms.Commands.UpdateRoom;
using CleanArchitecture.Core.Features.Rooms.Queries.GetAllRooms;
using CleanArchitecture.Core.Features.Rooms.Queries.GetRoomById;
using CleanArchitecture.Core.Features.Customers.Queries.GetAllCustomers;
using CleanArchitecture.Core.Features.Customers.Queries.GetCustomerById;
using CleanArchitecture.Core.Features.Customers.Commands.CreateCustomer;
using CleanArchitecture.Core.Features.Customers.Commands.UpdateCustomer;
using CleanArchitecture.Core.Features.Staff.Queries.GetAllStaff;
using CleanArchitecture.Core.Features.Staff.Queries.GetStaffById;
using CleanArchitecture.Core.Features.Staff.Commands.CreateStaff;
using CleanArchitecture.Core.Features.Staff.Commands.UpdateStaff;
using CleanArchitecture.Core.Features.Reservations.Queries.GetAllReservations;
using CleanArchitecture.Core.Features.Reservations.Queries.GetReservationById;
using CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation;
using CleanArchitecture.Core.Features.Reservations.Commands.UpdateReservation;
using CleanArchitecture.Core.Features.Income.Commands.CreateIncome;
using CleanArchitecture.Core.Features.Income.Queries.GetIncomes;
using CleanArchitecture.Core.Features.Expense.Commands.CreateExpense;
using CleanArchitecture.Core.Features.Expense.Commands.UpdateExpense;
using CleanArchitecture.Core.Features.Expense.Queries.GetExpenses;
using CleanArchitecture.Core.Features.FinancialReports.Queries.GetMonthlyFinancialReport;
using CleanArchitecture.Core.Features.FinancialReports.Queries.GetMonthlyDetails;
using CleanArchitecture.Core.Features.Income.Commands.UpdateIncome;
using CleanArchitecture.Core.Features.Shifts.Queries.GetShiftsByStaff; // ShiftViewModel için namespace

namespace CleanArchitecture.Core.Mappings
{
    public class GeneralProfile : Profile
    {
        public GeneralProfile()
        {
            // ================== ROOM MAPPINGS ==================
            CreateMap<Room, GetAllRoomsViewModel>()
                // Alan isimleri aynı olanlar (Id, RoomNumber, RoomType, Floor, Capacity, PricePerNight, IsOnMaintenance, Description) otomatik maplenir.
                .ForMember(dest => dest.Features, opt => opt.Ignore()) // Handler'da Amenities'ten doldurulacak
                .ForMember(dest => dest.ComputedStatus, opt => opt.Ignore()); // Handler'da hesaplanacak
            

            CreateMap<Room, GetRoomByIdViewModel>()
                // Alan isimleri aynı olanlar (Id, RoomNumber, RoomType, Floor, Capacity, PricePerNight, IsOnMaintenance, Description) otomatik maplenir.
                .ForMember(dest => dest.Features, opt => opt.Ignore()) // Handler'da Amenities'ten doldurulacak
                .ForMember(dest => dest.MaintenanceDetails, opt => opt.Ignore()) // Handler'da ayrıca map edilecek (aşağıya bakınız)
                .ForMember(dest => dest.ComputedStatus, opt => opt.Ignore()) // Handler'da hesaplanacak
                .ForMember(dest => dest.StatusCheckDate, opt => opt.Ignore()); // Handler'da set edilecek

            CreateMap<CreateRoomCommand, Room>()
                // Alan isimleri aynı olanlar (RoomNumber, RoomType, Floor, PricePerNight, Description) otomatik maplenir.
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.RoomCapacity)) // Farklı isim
                .ForMember(dest => dest.IsOnMaintenance, opt => opt.Ignore()) // Yeni odalar varsayılan false olur, komutla set edilmez.
                .ForMember(dest => dest.Amenities, opt => opt.Ignore()) // Handler'da Features listesine göre doldurulur
                .ForMember(dest => dest.MaintenanceIssues, opt => opt.Ignore())
                .ForMember(dest => dest.Reservations, opt => opt.Ignore())
                .ForMember(dest => dest.Id, opt => opt.Ignore()) // Yeni entity, ID otomatik atanır
                .ForMember(dest => dest.Created, opt => opt.Ignore()) // Handler'da atanır
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore()) // Handler'da atanır
                .ForMember(dest => dest.LastModified, opt => opt.Ignore())
                .ForMember(dest => dest.LastModifiedBy, opt => opt.Ignore());

            CreateMap<UpdateRoomCommand, Room>()
                // Alan isimleri aynı olanlar (Id, RoomNumber, RoomType, Floor, PricePerNight, IsOnMaintenance, Description) otomatik maplenir.
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.RoomCapacity)) // Farklı isim
                .ForMember(dest => dest.Amenities, opt => opt.Ignore()) // Handler'da Features listesine göre güncellenir
                .ForMember(dest => dest.MaintenanceIssues, opt => opt.Ignore()) // Bu komutla güncellenmez
                .ForMember(dest => dest.Reservations, opt => opt.Ignore()) // Bu komutla güncellenmez
                .ForMember(dest => dest.Created, opt => opt.Ignore()) // Update sırasında değişmez
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore()) // Update sırasında değişmez
                .ForMember(dest => dest.LastModified, opt => opt.Ignore()) // SaveChanges içinde otomatik atanabilir
                .ForMember(dest => dest.LastModifiedBy, opt => opt.Ignore()); // SaveChanges içinde otomatik atanabilir


            // ================== AMENITY MAPPINGS ==================
            CreateMap<Amenity, GetRoomAmenitiesViewModel>(); // GetRoomAmenities için
            // Belki Amenity -> string (Name) map'lemesi de eklenebilir ama Features listesi handler'da dolduruluyor.


            // ================== MAINTENANCE ISSUE MAPPINGS ==================
            CreateMap<AddMaintenanceIssueCommand, MaintenanceIssue>(); // RoomId otomatik maplenir.
            CreateMap<MaintenanceIssue, MaintenanceIssueViewModel>(); // GetRoomByIdViewModel için
            CreateMap<MaintenanceIssue, GetMaintenanceIssuesByRoomViewModel>(); // GetMaintenanceIssuesByRoom için


            // ================== CUSTOMER MAPPINGS ==================
            CreateMap<Customer, GetAllCustomersViewModel>()
                // Id, Email, Phone otomatik maplenir.
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status)); // Customer'ın Status alanı korunuyor.

             CreateMap<Customer, GetCustomerByIdViewModel>()
                 // Id, Email, Phone, Address, Status, Nationality, IdNumber, Notes, BirthDate otomatik maplenir.
                .ForMember(dest => dest.FullName, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.Reservations, opt => opt.Ignore()) // Handler'da doldurulur
                .ForMember(dest => dest.TotalSpending, opt => opt.Ignore()); // Handler'da hesaplanır

            CreateMap<CreateCustomerCommand, Customer>(); // Tüm alanlar (FirstName, LastName, Email, Phone, Address, Status, Nationality, IdNumber, Notes, BirthDate) maplenir.
            CreateMap<UpdateCustomerCommand, Customer>(); // Tüm alanlar maplenir.


            // ================== RESERVATION MAPPINGS ==================
            CreateMap<Reservation, GetAllReservationsViewModel>()
                // Id, CustomerId, RoomId, StartDate, EndDate, Status otomatik maplenir.
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => $"{src.Customer.FirstName} {src.Customer.LastName}"))
                .ForMember(dest => dest.RoomNumber, opt => opt.MapFrom(src => src.Room.RoomNumber))
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => src.Room.RoomType));

            CreateMap<Reservation, GetReservationByIdViewModel>()
                // Id, CustomerId, RoomId, StartDate, EndDate, NumberOfGuests, Price, Status, Rating otomatik maplenir.
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => $"{src.Customer.FirstName} {src.Customer.LastName}"))
                .ForMember(dest => dest.RoomNumber, opt => opt.MapFrom(src => src.Room.RoomNumber))
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => src.Room.RoomType));

            // Bu map GetCustomerByIdQueryHandler içinde kullanılıyor
            CreateMap<Reservation, ReservationHistoryViewModel>()
                // Id, Price, Status, Rating otomatik maplenir.
                .ForMember(dest => dest.RoomNumber, opt => opt.MapFrom(src => src.Room.RoomNumber))
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => src.Room.RoomType))
                .ForMember(dest => dest.CheckInDate, opt => opt.MapFrom(src => src.StartDate)) // Farklı isim
                .ForMember(dest => dest.CheckOutDate, opt => opt.MapFrom(src => src.EndDate)); // Farklı isim

            CreateMap<CreateReservationCommand, Reservation>()
                // RoomId, StartDate, EndDate, NumberOfGuests, Price otomatik maplenir.
                .ForMember(dest => dest.CustomerId, opt => opt.Ignore()) // Handler'da CustomerIdNumber'dan bulunup atanır.
                .ForMember(dest => dest.Status, opt => opt.Ignore()); // Handler'da "Pending" atanır.

            CreateMap<UpdateReservationCommand, Reservation>(); // Tüm alanlar maplenir (Id, CustomerId, RoomId, StartDate, EndDate, NumberOfGuests, Price, Status, Rating).


            // ================== STAFF MAPPINGS ==================
            CreateMap<Staff, GetAllStaffViewModel>()
                // Id, Department, Email, PhoneNumber, StartDate otomatik maplenir.
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.Position, opt => opt.MapFrom(src => $"{src.Role} ({src.Department})"))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.IsActive ? "Active" : "On Leave"));

            CreateMap<Staff, GetStaffByIdViewModel>()
                // Id, Department, Role, StartDate, Email, PhoneNumber, Salary otomatik maplenir.
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => $"{src.FirstName} {src.LastName}"))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.IsActive ? "Active" : "On Leave"))
                .ForMember(dest => dest.Shifts, opt => opt.MapFrom(src => src.Shifts)); // Alt liste maplenir (Shift -> ShiftViewModel gerekir)


            // Staff Commands (FirstName/LastName kullanıyor)
            CreateMap<CreateStaffCommand, Staff>(); // Name yerine FirstName/LastName otomatik map edilir.
            CreateMap<UpdateStaffCommand, Staff>(); // Name yerine FirstName/LastName otomatik map edilir.


            // ================== SHIFT MAPPINGS ==================
            // GetStaffByIdViewModel içindeki Shifts listesi için
            CreateMap<Shift, Features.Staff.Queries.GetStaffById.ShiftViewModel>()
                .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.StartTime.ToString(@"hh\:mm"))) // TimeSpan -> string
                .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.EndTime.ToString(@"hh\:mm"))); // TimeSpan -> string

            // GetShiftsByStaffQueryHandler içindeki Shifts listesi için (aynı ViewModel'ı kullanıyor gibi)
            CreateMap<Shift, Features.Shifts.Queries.GetShiftsByStaff.GetShiftsByStaffViewModel>()
                .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.StartTime.ToString(@"hh\:mm")))
                .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.EndTime.ToString(@"hh\:mm")))
                .ForMember(dest => dest.ShiftDate, opt => opt.MapFrom(src => src.ShiftDay.ToString("yyyy-MM-dd")));

            // ================== INCOME/EXPENSE MAPPINGS ==================
            CreateMap<CreateIncomeCommand, Income>();
            CreateMap<Income, GetIncomesViewModel>();
            CreateMap<UpdateIncomeCommand, Income>() // <<<< EKLENDİ
                .ForMember(dest => dest.Id, opt => opt.Ignore()); // ID map'lenmesin, zaten var

            CreateMap<CreateExpenseCommand, Expense>();
            CreateMap<Expense, GetExpensesViewModel>();
            CreateMap<UpdateExpenseCommand, Expense>() // <<<< EKLENDİ
                .ForMember(dest => dest.Id, opt => opt.Ignore()); // ID map'lenmesin, zaten var


            // ================== FINANCIAL REPORT MAPPINGS ==================
            CreateMap<MonthlyFinancialReport, GetMonthlyFinancialReportViewModel>();
            CreateMap<MonthlyFinancialReport, GetMonthlyDetailsViewModel>();

            // === GEREKSİZ VEYA YANLIŞ OLABİLECEK MAP'LEMELER (Yorumlandı) ===
            // Genellikle Query -> Parameter map'lemesine gerek olmaz. Parametreler doğrudan Query'ye atanır.
            // CreateMap<GetAllRoomsQuery, GetAllRoomsParameter>();
            // CreateMap<GetAllCustomersQuery, GetAllCustomersParameter>();
        }
    }
}