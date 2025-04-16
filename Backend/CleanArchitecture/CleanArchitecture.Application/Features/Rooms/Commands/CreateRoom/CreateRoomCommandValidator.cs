using CleanArchitecture.Core.Interfaces.Repositories;
using FluentValidation;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Rooms.Commands.CreateRoom
{
    public class CreateRoomCommandValidator : AbstractValidator<CreateRoomCommand>
    {
        private readonly IRoomRepositoryAsync _roomRepository;

        public CreateRoomCommandValidator(IRoomRepositoryAsync roomRepository)
        {
            _roomRepository = roomRepository;

            RuleFor(r => r.RoomNumber)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.")
                .MustAsync(IsUniqueRoomNumber).WithMessage("{PropertyName} already exists.");

            RuleFor(r => r.RoomType)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.");

            RuleFor(r => r.Floor)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThanOrEqualTo(0).WithMessage("{PropertyName} must be non-negative.");

            RuleFor(r => r.RoomCapacity)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .MaximumLength(50).WithMessage("{PropertyName} must not exceed 50 characters.");

            RuleFor(r => r.Status)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .Must(s => s == "available" || s == "occupied" || s == "on maintenance")
                .WithMessage("{PropertyName} must be one of: available, occupied, on maintenance.");

            RuleFor(r => r.PricePerNight)
                .NotEmpty().WithMessage("{PropertyName} is required.")
                .GreaterThan(0).WithMessage("{PropertyName} must be greater than zero.");
        }

        private async Task<bool> IsUniqueRoomNumber(int roomNumber, CancellationToken cancellationToken)
        {
            return await _roomRepository.IsUniqueRoomNumberAsync(roomNumber);
        }
    }
}