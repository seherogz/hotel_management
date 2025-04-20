// CleanArchitecture.WebApi/Program.cs

using CleanArchitecture.Core;
using CleanArchitecture.Core.Interfaces;
using CleanArchitecture.Infrastructure;
using CleanArchitecture.Infrastructure.Contexts;
using CleanArchitecture.Infrastructure.Models;
using CleanArchitecture.WebApi.Extensions;
using CleanArchitecture.WebApi.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection; // Sadece bir tane gerekli
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Serilog;
using System;
using System.Linq;
using System.Threading.Tasks;
using CleanArchitecture.Infrastructure.Seeds;
using Microsoft.Extensions.Diagnostics.HealthChecks; // Sadece bir tane gerekli
using Polly;
using Microsoft.AspNetCore.Http; // PathString için

var builder = WebApplication.CreateBuilder(args);

// --- Güvenlik Ayarları ---
var trustedOrigins = builder.Configuration.GetSection("SecuritySettings:TrustedOrigins").Get<string[]>() ?? Array.Empty<string>();
var corsPolicyName = "AllowSpecificOrigins";

// Add configurations
builder.Configuration.AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
builder.Configuration.AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true, reloadOnChange: true);
if (builder.Environment.IsDevelopment())
{
    // User secrets genellikle geliştirme ortamında kullanılır
    builder.Configuration.AddUserSecrets<Program>(optional: true);
}
builder.Configuration.AddEnvironmentVariables();


// Add services to the container.
builder.Services.AddApplicationLayer();
builder.Services.AddPersistenceInfrastructure(builder.Configuration); // DbContext burada ekleniyor
builder.Services.AddSwaggerExtension();
builder.Services.AddControllers();
builder.Services.AddApiVersioningExtension();

// ***** Health Check Servislerinin Eklenmesi *****
builder.Services.AddHealthChecks()
    .AddNpgSql( // AddDbContextCheck yerine AddNpgSql
        builder.Configuration.GetConnectionString("DefaultConnection"), // appsettings'den bağlantı dizesini alır
        name: "postgresql-check", // Sağlık kontrolü için bir isim
        failureStatus: HealthStatus.Unhealthy, // Hata durumunda döndürülecek durum
        tags: new[] { "database" }); // Etiket (opsiyonel)
// ***** Health Check Servisleri Sonu *****

builder.Services.AddScoped<IAuthenticatedUserService, AuthenticatedUserService>();

// CORS Politikasını Yapılandır
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: corsPolicyName,
                      policy =>
                      {
                          if (builder.Environment.IsDevelopment())
                          {
                              // Geliştirme ortamında daha esnek olabiliriz
                              policy.AllowAnyOrigin()
                                    .AllowAnyHeader()
                                    .AllowAnyMethod();
                          }
                          else
                          {
                              // Production ortamında sadece güvenilir adreslere izin ver
                              if (trustedOrigins.Any())
                              {
                                  policy.WithOrigins(trustedOrigins)
                                        .AllowAnyHeader()
                                        .AllowAnyMethod();
                              }
                              else
                              {
                                  // Güvenilir origin yoksa uyarı ver ve (isteğe bağlı) engelle
                                  Log.Warning("No trusted origins configured for CORS in production environment.");
                                  // policy.WithOrigins("").AllowAnyHeader().AllowAnyMethod(); // Engellemek için
                              }
                          }
                      });
});


// Initialize Logger
Log.Logger = new LoggerConfiguration()
                .ReadFrom.Configuration(builder.Configuration) // appsettings.json'dan oku
                .Enrich.FromLogContext()
                .WriteTo.Console()
                // Production için:
                // .WriteTo.File("logs/log-.txt", rollingInterval: RollingInterval.Day)
                .CreateLogger();

// Serilog'u ASP.NET Core logging pipeline'ına entegre et
builder.Host.UseSerilog();

// Build the application
var app = builder.Build();

// Configure the HTTP request pipeline (Middleware'ler). Sıralama önemlidir!
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage(); // Geliştirme ortamında detaylı hata sayfası
}
else
{
    // Production ortamında genel hata sayfası ve HSTS
    app.UseExceptionHandler("/Error"); // Genel Hata Yakalama (Razor Page veya MVC Action olabilir)
    app.UseHsts(); // HTTPS yönlendirmesi sonrası tarayıcıya sadece HTTPS kullanmasını söyler
}

// HTTPS Yönlendirmesi (HSTS'den önce gelir)
app.UseHttpsRedirection();

// Serilog HTTP İstek Loglaması (Routing'den önce)
app.UseSerilogRequestLogging();

// Routing Middleware'i
app.UseRouting();

// CORS Middleware'i (Routing'den sonra, Auth'dan önce)
app.UseCors(corsPolicyName);

// Authentication ve Authorization Middleware'leri
app.UseAuthentication();
app.UseAuthorization();

// Swagger Middleware'leri
app.UseSwaggerExtension(); // Kendi extension metodunuz

// Özel Hata Yönetimi Middleware'i (Authorization'dan sonra, endpoint'lerden önce)
app.UseErrorHandlingMiddleware(); // Kendi extension metodunuz

// Health Check Endpoint'i
app.MapHealthChecks("/health");

// Controller Endpoint'lerini Eşle
app.MapControllers();

// --- Veritabanı Oluşturma ve Seed İşlemleri ---
try
{
    Log.Information("Starting Database Initialization and Seeding Process...");
    // Uygulama başlangıcında veritabanını hazırlayan ve seed eden helper metot
    await InitializeAndSeedDatabaseAsync(app);
    Log.Information("Database Initialization and Seeding Process Completed Successfully.");
}
catch (Exception ex)
{
    // Başlangıçta kritik bir hata oluşursa logla ve uygulamayı durdur (isteğe bağlı)
    Log.Fatal(ex, "A critical error occurred during database initialization or seeding. Application startup failed.");
    // Environment.Exit(-1); // Uygulamayı hemen sonlandırabilir veya başka bir mekanizma kullanabilirsiniz
}
// --- Veritabanı Oluşturma ve Seed İşlemleri Sonu ---


Log.Information("Application is Starting...");

// Uygulamayı Çalıştır
app.Run();


// --- Helper Metot: Veritabanı Başlatma ve Seed (Transaction Kaldırılmış) ---
static async Task InitializeAndSeedDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var loggerFactory = services.GetRequiredService<ILoggerFactory>();
    var dbContext = services.GetRequiredService<ApplicationDbContext>();
    var env = services.GetRequiredService<IWebHostEnvironment>();
    var logger = loggerFactory.CreateLogger("DatabaseInitializer");

    var retryPolicy = Policy
        .Handle<Exception>()
        .WaitAndRetryAsync(3, retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
            (exception, timeSpan, retryCount, context) =>
            {
                logger.LogWarning(exception, "Retry {RetryCount} encountered an error during DB operations. Retrying after {TimeSpan}s...", retryCount, timeSpan.TotalSeconds);
            });

    // Retry policy ile veritabanı işlemlerini çalıştır
    await retryPolicy.ExecuteAsync(async () =>
    {
        // --- Veritabanı Şema İşlemleri ---
        if (env.IsDevelopment())
        {
            logger.LogInformation("Development environment. Applying database migrations...");
            // Eski silme ve oluşturma kodunu kaldır/yorumla:
            // logger.LogInformation("Attempting to delete database (if exists)...");
            // bool deleted = await dbContext.Database.EnsureDeletedAsync();
            // logger.LogInformation("Database deleted status: {Deleted}", deleted);
            // logger.LogInformation("Attempting to create database using current model...");
            // bool created = await dbContext.Database.EnsureCreatedAsync();
            // logger.LogInformation("Database created status: {Created}", created);
            // if (created)
            // {
            //     await Task.Delay(TimeSpan.FromSeconds(2)); // Stabilizasyon için bekle
            //     logger.LogInformation("Waited 2 seconds after database creation.");
            // }

            // Verileri silmeden migration'ları uygula:
            try
            {
                await dbContext.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while applying database migrations.");
                // Geliştirme ortamında migration hatası olursa uygulamayı durdurmak isteyebilirsiniz.
                throw; // Hatanın yukarıya fırlatılması
            }
        }
        else
        {
            logger.LogInformation("Non-development environment. Ensuring DB connection...");
            bool dbExists = await dbContext.Database.CanConnectAsync();
             if (!dbExists)
             {
                 logger.LogWarning("Database does not exist or cannot connect. Manual intervention or migration might be required.");
                 // Gerekirse burada hata fırlatılabilir.
                 // throw new InvalidOperationException("Database connection failed in non-development environment.");
             }
             else{
                 logger.LogInformation("Database connection successful.");
             }
        }
        // --- Veritabanı Şema İşlemleri Sonu ---


        // --- Seed İşlemleri (Transaction YOK) ---
        // Artık manuel transaction kullanmıyoruz.
        // Her Seed metodunun kendi SaveChangesAsync çağrısını yapması veya
        // Identity metotlarının kendi kaydetme mekanizmalarına güveniyoruz.
        // EnableRetryOnFailure bu SaveChangesAsync çağrılarını kapsayacaktır.
        logger.LogInformation("Starting data seeding (without manual transaction)...");
        try
        {
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
            var seedLogger = services.GetRequiredService<ILogger<ApplicationDbContext>>();

            // Seed metotları çağrılıyor.
            // DefaultHotelData.SeedAsync içinde zaten SaveChangesAsync çağrısı var.
            await DefaultHotelData.SeedAsync(dbContext, seedLogger);
            // Identity metotları (CreateAsync, AddToRoleAsync) kendi değişikliklerini kaydeder.
            await DefaultRoles.SeedAsync(userManager, roleManager);
            await DefaultSuperAdmin.SeedAsync(userManager, roleManager);
            await DefaultReceptionistUser.SeedAsync(userManager, roleManager);

            logger.LogInformation("Data seeding completed successfully.");
        }
        catch (Exception ex)
        {
            // Seed sırasında hata olursa logla. Rollback yapacak manuel transaction yok.
            logger.LogError(ex, "An error occurred during data seeding.");
            // Hatanın yukarıya (retry policy veya ana try-catch bloğuna) fırlatılması
            throw;
        }
        // --- Seed İşlemleri Sonu ---

    }); // Retry Policy scope sonu
}
// --- Helper Metot Sonu ---