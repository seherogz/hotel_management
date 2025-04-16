using FluentValidation;
using System;

namespace CleanArchitecture.Core.Features.Reservations.Commands.CreateReservation
{
    public class CreateReservationCommandValidator : AbstractValidator<CreateReservationCommand>
    {
        public CreateReservationCommandValidator()
        {
            RuleFor(r => r.CustomerId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.");

            RuleFor(r => r.RoomId)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.");

            RuleFor(r => r.StartDate)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThanOrEqualTo(DateTime.Today).WithMessage("Start date cannot be in the past.");

            RuleFor(r => r.EndDate)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(r => r.StartDate).WithMessage("End date must be after start date.");

            RuleFor(r => r.NumberOfGuests)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.");

            RuleFor(r => r.Price)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.");

            RuleFor(r => r.Status)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Must(s => s == "Pending" || s == "Checked-in" || s == "Completed" || s == "Cancelled")
                .WithMessage("{PropertyName} must be one of: Pending, Checked-in, Completed, Cancelled.");
        }
    }
}