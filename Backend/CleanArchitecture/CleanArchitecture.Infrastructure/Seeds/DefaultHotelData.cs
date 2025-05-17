// File: Backend/CleanArchitecture/CleanArchitecture.Infrastructure/Seeds/DefaultHotelData.cs
using CleanArchitecture.Core.Entities;
using CleanArchitecture.Infrastructure.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Seeds
{
    public static class DefaultHotelData
    {
        public static async Task SeedAsync(ApplicationDbContext context, ILogger<ApplicationDbContext> logger)
        {
            // Tek bir SaveChangesAsync kullanmak için flag. Birden fazla AddRangeAsync/UpdateRange sonrasında tek seferde kaydeder.
            bool changesMade = false;

            try
            {
                // Seed Amenities (Önce Olanaklar)
                List<Amenity> seedAmenities = new();
                if (!await context.Amenities.AnyAsync())
                {
                    logger.LogInformation("Adding seed data for amenities...");
                    seedAmenities = new List<Amenity>
                    {
                        new Amenity { Name = "Wi-Fi", IsActive = true, Description = "Unlimited Wi-Fi" },
                        new Amenity { Name = "TV", IsActive = true, Description = "HD Television" },
                        new Amenity { Name = "Mini Bar", IsActive = true, Description = "Filled Mini Bar" },
                        new Amenity { Name = "Air Conditioning", IsActive = true, Description = "Air Conditioning" },
                        new Amenity { Name = "Jacuzzi", IsActive = true, Description = "Jacuzzi" },
                        new Amenity { Name = "Balcony", IsActive = true, Description = "Private Balcony" },
                        new Amenity { Name = "Coffee Machine", IsActive = true, Description = "Coffee Machine" }
                    };
                    // Değişiklikleri hemen kaydetmek yerine AddRangeAsync kullanıp sonda tek SaveChangesAsync yapıyoruz.
                    await context.Amenities.AddRangeAsync(seedAmenities);
                    changesMade = true; // Değişiklik yapıldı olarak işaretle
                    logger.LogInformation("Amenities prepared for seeding.");
                }
                else
                {
                    // Eğer önceden varsa, sonraki adımlar için listeyi doldur (güncelleme senaryoları için önemli olabilir)
                    seedAmenities = await context.Amenities.ToListAsync();
                    logger.LogInformation("Amenities already exist, retrieved for room assignment.");
                }

                // Seed Rooms (Olanakları atayarak)
                List<Room> seedRooms = new();
                 if (!await context.Rooms.AnyAsync())
                {
                    logger.LogInformation("Adding seed data for rooms with amenities...");

                    // Olanakları isimlerine göre hızlı erişim için dictionary yapalım (varsa güncel listeyi kullanır)
                    var amenitiesDict = seedAmenities.ToDictionary(a => a.Name);

                    seedRooms = new List<Room>
                    {
                        new Room
                        {
                            RoomNumber = 101, RoomType = "Standard", Floor = 1, Capacity = "2",
                            IsOnMaintenance = false, // Status yerine IsOnMaintenance
                            PricePerNight = 500M, Description = "City view standard room", CreatedBy = "System", Created = DateTime.UtcNow,
                            Amenities = new List<Amenity> { amenitiesDict["Wi-Fi"], amenitiesDict["TV"], amenitiesDict["Air Conditioning"] }
                        },
                        new Room
                        {
                            RoomNumber = 102, RoomType = "Standard", Floor = 1, Capacity = "2",
                            IsOnMaintenance = false, // Status yerine IsOnMaintenance
                            PricePerNight = 500M, Description = "City view standard room", CreatedBy = "System", Created = DateTime.UtcNow,
                            Amenities = new List<Amenity> { amenitiesDict["Wi-Fi"], amenitiesDict["TV"], amenitiesDict["Air Conditioning"] }
                        },
                        new Room
                        {
                            RoomNumber = 201, RoomType = "Deluxe", Floor = 2, Capacity = "2",
                            IsOnMaintenance = false, // Status yerine IsOnMaintenance
                            PricePerNight = 750M, Description = "Sea view deluxe room", CreatedBy = "System", Created = DateTime.UtcNow,
                            Amenities = new List<Amenity> { amenitiesDict["Wi-Fi"], amenitiesDict["TV"], amenitiesDict["Air Conditioning"], amenitiesDict["Mini Bar"], amenitiesDict["Balcony"] }
                        },
                        new Room
                        {
                            RoomNumber = 301, RoomType = "Suite", Floor = 3, Capacity = "4",
                            IsOnMaintenance = false, // Status yerine IsOnMaintenance
                            PricePerNight = 1200M, Description = "Sea view spacious suite room", CreatedBy = "System", Created = DateTime.UtcNow,
                            Amenities = amenitiesDict.Values.ToList() // Tüm olanaklar
                        }
                    };
                    // Odaları AddRangeAsync ile ekle
                    await context.Rooms.AddRangeAsync(seedRooms);
                    changesMade = true; // Değişiklik yapıldı olarak işaretle
                    logger.LogInformation("Rooms with amenities prepared for seeding.");
                }
                 else
                 {
                      // Eğer odalar varsa, bakım kayıtları için listeyi doldur
                      seedRooms = await context.Rooms.ToListAsync();
                      logger.LogInformation("Rooms already exist, retrieved for maintenance issue assignment.");
                 }


                // Add maintenance issues (Odalar eklendikten sonra)
                


                // Eğer herhangi bir değişiklik yapıldıysa (Amenity, Room, MaintenanceIssue), tek seferde kaydet
                if (changesMade)
                {
                    await context.SaveChangesAsync(); // Tek SaveChangesAsync çağrısı
                    logger.LogInformation("Hotel seed data successfully saved.");
                }
                else
                {
                     logger.LogInformation("No new hotel seed data needed.");
                }

            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred during hotel seed data loading.");
                // Hatanın yukarıya fırlatılması önemli, Program.cs'deki retry policy veya genel hata yönetimi yakalayabilir.
                throw;
            }
        }
    }
}