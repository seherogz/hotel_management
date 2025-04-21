// File: Backend/CleanArchitecture/CleanArchitecture.Application/Features/Reservations/Commands/CreateReservation/CreateReservationCommandValidator.cs
using FluentValidation;
using System;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation
{
    public class CreateReservationCommandValidator : AbstractValidator<CreateReservationCommand>
    {
        // ICustomerRepositoryAsync gibi bağımlılıklara gerek yoksa constructor kaldırılabilir.
        // Şimdilik sadece temel kuralları kontrol ediyoruz.
        public CreateReservationCommandValidator()
        {
            RuleFor(r => r.CustomerIdNumber) // CustomerId yerine IdNumber kontrolü
                .NotEmpty().WithMessage("Müşteri kimlik numarası gereklidir.");
            // Gerekirse burada IdNumber formatı için ek kurallar eklenebilir.

            RuleFor(r => r.RoomId)
                .NotEmpty().WithMessage("Oda ID'si gereklidir.")
                .GreaterThan(0).WithMessage("Oda ID'si sıfırdan büyük olmalıdır.");

            RuleFor(r => r.StartDate)
                .NotEmpty().WithMessage("Başlangıç tarihi gereklidir.")
                .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Başlangıç tarihi geçmiş bir tarih olamaz."); // Veya DateTime.UtcNow.Date

            RuleFor(r => r.EndDate)
                .NotEmpty().WithMessage("Bitiş tarihi gereklidir.")
                .GreaterThan(r => r.StartDate).WithMessage("Bitiş tarihi başlangıç tarihinden sonra olmalıdır.");

            RuleFor(r => r.NumberOfGuests)
                .NotEmpty().WithMessage("Misafir sayısı gereklidir.")
                .GreaterThan(0).WithMessage("Misafir sayısı sıfırdan büyük olmalıdır.");

            RuleFor(r => r.Price)
                .NotEmpty().WithMessage("Fiyat gereklidir.")
                .GreaterThan(0).WithMessage("Fiyat sıfırdan büyük olmalıdır.");

            // Status alanı Command'dan kaldırıldığı için validator'da da kural yok.
        }
    }
}