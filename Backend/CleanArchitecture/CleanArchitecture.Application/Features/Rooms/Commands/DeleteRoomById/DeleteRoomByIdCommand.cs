using CleanArchitecture.Core.Entities;
using CleanArchitecture.Core.Exceptions;
using CleanArchitecture.Core.Interfaces.Repositories;
using MediatR;
using System.Threading;
using System.Threading.Tasks;

namespace CleanArchitecture.Core.Features.Rooms.Commands.DeleteRoomById
{
    public class DeleteRoomByIdCommand : IRequest<int>
    {
        public int Id { get; set; }
    }

    public class DeleteRoomByIdCommandHandler : IRequestHandler<DeleteRoomByIdCommand, int>
    {
        private readonly IRoomRepositoryAsync _roomRepository;

        public DeleteRoomByIdCommandHandler(IRoomRepositoryAsync roomRepository)
        {
            _roomRepository = roomRepository;
        }

        public async Task<int> Handle(DeleteRoomByIdCommand request, CancellationToken cancellationToken)
        {
            var room = await _roomRepository.GetByIdAsync(request.Id);
            
            if (room == null)
            {
                throw new EntityNotFoundException("Entity", request.Id);
            }
            
            await _roomRepository.DeleteAsync(room);
            
            return room.Id;
        }
    }
}