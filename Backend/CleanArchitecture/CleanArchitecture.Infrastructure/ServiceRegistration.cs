using CleanArchitecture.Core.Interfaces;
using CleanArchitecture.Core.Interfaces.Repositories;
using CleanArchitecture.Core.Settings;
using CleanArchitecture.Infrastructure.Contexts;
using CleanArchitecture.Infrastructure.Models;
using CleanArchitecture.Infrastructure.Repositories;
using CleanArchitecture.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Text;
using CleanArchitecture.Application.Interfaces;


namespace CleanArchitecture.Infrastructure
{
    public static class ServiceRegistration
    {
        public static void AddPersistenceInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            if (configuration.GetValue<bool>("UseInMemoryDatabase"))
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("ApplicationDb"));
            }
            else
            {
                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseNpgsql(
                        configuration.GetConnectionString("DefaultConnection"),
                        npgsqlOptions => 
                        {
                            npgsqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                            npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
                        })
                    .EnableSensitiveDataLogging()
                    .EnableDetailedErrors();
                });
            }

            services.AddScoped<IApplicationDbContext>(provider => provider.GetService<ApplicationDbContext>());

            services.AddIdentity<ApplicationUser, IdentityRole>().AddEntityFrameworkStores<ApplicationDbContext>().AddDefaultTokenProviders();
            #region Services
            services.AddTransient<IAccountService, AccountService>();
            #endregion
            services.Configure<JWTSettings>(configuration.GetSection("JWTSettings"));
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
                .AddJwtBearer(o =>
                {
                    o.RequireHttpsMetadata = false;
                    o.SaveToken = false;
                    o.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero,
                        ValidIssuer = configuration["JWTSettings:Issuer"],
                        ValidAudience = configuration["JWTSettings:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["JWTSettings:Key"]))
                    };
                    o.Events = new JwtBearerEvents()
                    {
                        OnAuthenticationFailed = c =>
                        {
                            c.NoResult();
                            c.Response.StatusCode = 500;
                            c.Response.ContentType = "text/plain";
                            return c.Response.WriteAsync(c.Exception.ToString());
                        },
                        OnChallenge = context =>
                        {
                            context.HandleResponse();
                            context.Response.StatusCode = 401;
                            context.Response.ContentType = "application/json";
                            var result = "You are not Authorized";
                            return context.Response.WriteAsync(result);
                        },
                        OnForbidden = context =>
                        {
                            context.Response.StatusCode = 403;
                            context.Response.ContentType = "application/json";
                            var result = "You are not authorized to access this resource";
                            return context.Response.WriteAsync(result);
                        },
                    };
                });

            services.Configure<MailSettings>(configuration.GetSection("MailSettings"));
            services.AddTransient<IDateTimeService, DateTimeService>();
            services.AddTransient<IEmailService, EmailService>();

            #region Repositories
            services.AddTransient(typeof(IGenericRepositoryAsync<>), typeof(GenericRepositoryAsync<>));
            
            // Register room management repositories
            services.AddTransient<IRoomRepositoryAsync, RoomRepositoryAsync>();
            services.AddTransient<IAmenityRepositoryAsync, AmenityRepositoryAsync>();
            services.AddTransient<IMaintenanceIssueRepositoryAsync, MaintenanceIssueRepositoryAsync>();
            
            // Register customer management repositories
            services.AddTransient<ICustomerRepositoryAsync, CustomerRepositoryAsync>();
            services.AddTransient<IReservationRepositoryAsync, ReservationRepositoryAsync>();
            
            // Register staff management repositories
            services.AddTransient<IStaffRepositoryAsync, StaffRepositoryAsync>();
            services.AddTransient<IShiftRepositoryAsync, ShiftRepositoryAsync>();
            
            // Register financial repositories
            services.AddTransient<IIncomeRepositoryAsync, IncomeRepositoryAsync>();
            services.AddTransient<IExpenseRepositoryAsync, ExpenseRepositoryAsync>();
            services.AddTransient<IMonthlyFinancialReportRepositoryAsync, MonthlyFinancialReportRepositoryAsync>();
            #endregion
        }
    }
}