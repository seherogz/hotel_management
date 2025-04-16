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

namespace CleanArchitecture.Core.Mappings
{
    public class GeneralProfile : Profile
    {
        public GeneralProfile()
        {
            // Room mappings
            CreateMap<Room, GetAllRoomsViewModel>();
            CreateMap<CreateRoomCommand, Room>()
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.RoomCapacity));
            CreateMap<UpdateRoomCommand, Room>()
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.RoomCapacity));
            
            CreateMap<Room, GetRoomByIdViewModel>()
                .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.RoomNumber, opt => opt.MapFrom(src => src.RoomNumber))
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => src.RoomType))
                .ForMember(dest => dest.Floor, opt => opt.MapFrom(src => src.Floor))
                .ForMember(dest => dest.Capacity, opt => opt.MapFrom(src => src.Capacity)) // Assuming Room entity has Capacity
                .ForMember(dest => dest.PricePerNight, opt => opt.MapFrom(src => src.PricePerNight))
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                // *** IGNORE fields populated manually in the handler ***
                .ForMember(dest => dest.Features, opt => opt.Ignore())
                .ForMember(dest => dest.MaintenanceDetails, opt => opt.Ignore());
            
            CreateMap<GetAllRoomsQuery, GetAllRoomsParameter>();

            // Amenity mappings
            CreateMap<Amenity, GetRoomAmenitiesViewModel>();

            // MaintenanceIssue mappings
            CreateMap<AddMaintenanceIssueCommand, MaintenanceIssue>();
            CreateMap<MaintenanceIssue, MaintenanceIssueViewModel>();
            CreateMap<MaintenanceIssue, GetMaintenanceIssuesByRoomViewModel>();
            
            // Customer mappings
            CreateMap<Customer, GetAllCustomersViewModel>();
            CreateMap<CreateCustomerCommand, Customer>();
            CreateMap<UpdateCustomerCommand, Customer>();
            CreateMap<Customer, GetCustomerByIdViewModel>();
            CreateMap<GetAllCustomersQuery, GetAllCustomersParameter>();
            
            // Reservation mappings
            CreateMap<Reservation, GetAllReservationsViewModel>();
            CreateMap<CreateReservationCommand, Reservation>();
            CreateMap<UpdateReservationCommand, Reservation>();
            CreateMap<Reservation, GetReservationByIdViewModel>();
            CreateMap<Reservation, ReservationHistoryViewModel>()
                .ForMember(dest => dest.RoomNumber, opt => opt.MapFrom(src => src.Room.RoomNumber))
                .ForMember(dest => dest.RoomType, opt => opt.MapFrom(src => src.Room.RoomType))
                .ForMember(dest => dest.CheckInDate, opt => opt.MapFrom(src => src.StartDate))
                .ForMember(dest => dest.CheckOutDate, opt => opt.MapFrom(src => src.EndDate));
                
            // Staff mappings
            CreateMap<Staff, GetAllStaffViewModel>()
                // Name alanı ViewModel'de Ad Soyad birleşimi olacak, Handler'da doldurulacak
                .ForMember(dest => dest.Name, opt => opt.Ignore())
                // Position alanı ViewModel'de Rol (Departman) birleşimi, Handler'da doldurulacak
                .ForMember(dest => dest.Position, opt => opt.Ignore())
                // Status alanı ViewModel'de IsActive'e göre belirlenecek, Handler'da doldurulacak
                .ForMember(dest => dest.Status, opt => opt.Ignore());

            CreateMap<CreateStaffCommand, Staff>(); // FirstName, LastName doğrudan map edilir.
            CreateMap<UpdateStaffCommand, Staff>(); // FirstName, LastName doğrudan map edilir.
            
            CreateMap<Staff, GetStaffByIdViewModel>()
                // Name alanı ViewModel'de yok, FirstName/LastName var
                .ForMember(dest => dest.Name, opt => opt.Ignore()) // Eski Name alanı yok sayılır
                .ForMember(dest => dest.Status, opt => opt.Ignore()); // Handler'da doldurulacak
            // Shifts zaten GetStaffByIdViewModel içinde List<ShiftViewModel> olarak tanımlı, AutoMapper alt listeyi map eder
            
            // Shift mappings
            CreateMap<Shift, Features.Staff.Queries.GetStaffById.ShiftViewModel>()
                .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.StartTime.ToString(@"hh\:mm")))
                .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.EndTime.ToString(@"hh\:mm")));

            // Shift mappings (GetShiftsByStaffViewModel için - eğer farklıysa)
            CreateMap<Shift, Features.Shifts.Queries.GetShiftsByStaff.GetShiftsByStaffViewModel>()
                .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.StartTime.ToString(@"hh\:mm")))
                .ForMember(dest => dest.EndTime, opt => opt.MapFrom(src => src.EndTime.ToString(@"hh\:mm")));

            // Room -> GetAllRoomsViewModel mapping (Features için ignore)
            CreateMap<Room, GetAllRoomsViewModel>()
                .ForMember(dest => dest.Features, opt => opt.Ignore()); // Handler'da Include ile gelen Amenities'ten doldurulacak

            // Income and Expense mappings
            CreateMap<Features.Income.Commands.CreateIncome.CreateIncomeCommand, Income>();
            CreateMap<Income, Features.Income.Queries.GetIncomes.GetIncomesViewModel>();
            
            CreateMap<Features.Expense.Commands.CreateExpense.CreateExpenseCommand, Expense>();
            CreateMap<Expense, Features.Expense.Queries.GetExpenses.GetExpensesViewModel>();
            
            // Financial Report mappings
            CreateMap<MonthlyFinancialReport, Features.FinancialReports.Queries.GetMonthlyFinancialReport.GetMonthlyFinancialReportViewModel>();
            CreateMap<MonthlyFinancialReport, Features.FinancialReports.Queries.GetMonthlyDetails.GetMonthlyDetailsViewModel>();
            
            // Room Availability mappings
            CreateMap<Room, Features.Rooms.Queries.GetAvailableRooms.GetAvailableRoomsViewModel>();
            CreateMap<MaintenanceIssue, Features.Rooms.Queries.GetAvailableRooms.MaintenanceDetailsViewModel>()
                .ForMember(dest => dest.Issue, opt => opt.MapFrom(src => src.IssueDescription))
                .ForMember(dest => dest.EstimatedCompletionDate, opt => opt.MapFrom(src => src.EstimatedCompletionDate.ToString("yyyy-MM-dd")));
        }
    }
}