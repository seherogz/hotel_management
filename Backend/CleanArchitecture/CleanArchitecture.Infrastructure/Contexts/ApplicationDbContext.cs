// File: Backend/CleanArchitecture/CleanArchitecture.Infrastructure/Contexts/ApplicationDbContext.cs
using System;
using System.Threading;
using System.Threading.Tasks;
using CleanArchitecture.Application.Interfaces;
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Infrastructure.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CleanArchitecture.Infrastructure.Contexts
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>, IApplicationDbContext
    {
        private readonly ILogger<ApplicationDbContext> _logger;

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            ILogger<ApplicationDbContext> logger = null) : base(options)
        {
            _logger = logger;
        }

        public DbSet<Room> Rooms { get; set; }
        public DbSet<Amenity> Amenities { get; set; }
        public DbSet<MaintenanceIssue> MaintenanceIssues { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Staff> Staff { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Income> Incomes { get; set; }
        public DbSet<MonthlyFinancialReport> MonthlyFinancialReports { get; set; }
        public DbSet<Shift> Shifts { get; set; }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // Burada AuditableBaseEntity için Created/LastModified gibi alanları otomatik dolduran bir logic eklenebilir.
            // Örnek:
            /*
            var entries = ChangeTracker
                .Entries()
                .Where(e => e.Entity is AuditableBaseEntity && (
                        e.State == EntityState.Added
                        || e.State == EntityState.Modified));

            // IAuthenticatedUserService inject edilerek kullanıcı bilgisi alınabilir.
            // var userId = _authenticatedUserService.UserId;
            var currentUsername = "System"; // Veya gerçek kullanıcı adı

            foreach (var entityEntry in entries)
            {
                ((AuditableBaseEntity)entityEntry.Entity).LastModified = DateTime.UtcNow;
                ((AuditableBaseEntity)entityEntry.Entity).LastModifiedBy = currentUsername;

                if (entityEntry.State == EntityState.Added)
                {
                    ((AuditableBaseEntity)entityEntry.Entity).Created = DateTime.UtcNow;
                    ((AuditableBaseEntity)entityEntry.Entity).CreatedBy = currentUsername;
                }
            }
            */
            try
            {
                return await base.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger?.LogError(ex, "Error saving changes to database");
                throw;
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Amenity configuration
            modelBuilder.Entity<Amenity>(entity =>
            {
                entity.Property(e => e.Name)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Description)
                    .HasMaxLength(200);
            });

            // Room configuration
            modelBuilder.Entity<Room>(entity =>
            {
                entity.Property(e => e.RoomNumber)
                    .IsRequired();

                entity.Property(e => e.RoomType)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Capacity)
                    .HasMaxLength(20);

                // Status alanı kaldırıldı
                // entity.Property(e => e.Status)...

                // IsOnMaintenance alanı için varsayılan değer
                entity.Property(e => e.IsOnMaintenance)
                    .HasDefaultValue(false); // <<< GÜNCELLENDİ

                entity.Property(e => e.Description)
                    .HasMaxLength(500);

                entity.Property(e => e.PricePerNight)
                    .HasColumnType("decimal(18,2)");
            });

            // Configure many-to-many relationship between Room and Amenity
            modelBuilder.Entity<Room>()
                .HasMany(r => r.Amenities)
                .WithMany(a => a.Rooms)
                .UsingEntity(j => j.ToTable("RoomAmenities"));

            // MaintenanceIssue configuration
            modelBuilder.Entity<MaintenanceIssue>()
                .HasOne(m => m.Room)
                .WithMany(r => r.MaintenanceIssues)
                .HasForeignKey(m => m.RoomId);

            // Reservation configuration
            modelBuilder.Entity<Reservation>(entity =>
            {
                entity.HasOne(r => r.Room)
                    .WithMany(room => room.Reservations)
                    .HasForeignKey(r => r.RoomId);

                entity.HasOne(r => r.Customer)
                    .WithMany(c => c.Reservations)
                    .HasForeignKey(r => r.CustomerId);

                 // Rezervasyon Durumu için string uzunluğu (isteğe bağlı)
                 entity.Property(e => e.Status)
                    .HasMaxLength(20);
            });

            // Staff configuration
            modelBuilder.Entity<Staff>(entity =>
            {
                entity.Property(e => e.FirstName)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.LastName)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(e => e.Email)
                    .IsRequired()
                    .HasMaxLength(100);
            });

            // Shift configuration
            modelBuilder.Entity<Shift>(entity =>
            {
                entity.HasOne(s => s.Staff)
                    .WithMany(staff => staff.Shifts)
                    .HasForeignKey(s => s.StaffId);
            });
        }
    }
}