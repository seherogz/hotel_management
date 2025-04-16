using CleanArchitecture.Core.Enums;
using CleanArchitecture.Infrastructure.Models;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace CleanArchitecture.Infrastructure.Seeds
{
    public static class DefaultReceptionistUser
    {
        public static async Task SeedAsync(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            //Seed Default User
            var defaultUser = new ApplicationUser
            {
                UserName = "receptionist",
                Email = "receptionist@gmail.com",
                FirstName = "John",
                LastName = "Doe",
                EmailConfirmed = true,
                PhoneNumberConfirmed = true
            };
            if (userManager.Users.All(u => u.Id != defaultUser.Id))
            {
                var user = await userManager.FindByEmailAsync(defaultUser.Email);
                if (user == null)
                {
                    await userManager.CreateAsync(defaultUser, "123Pa$$word!");
                    
                    // Generate email confirmation token
                    var token = await userManager.GenerateEmailConfirmationTokenAsync(defaultUser);
                    await userManager.ConfirmEmailAsync(defaultUser, token);
                    
                    // Add role
                    await userManager.AddToRoleAsync(defaultUser, Roles.Receptionist.ToString());
                }

            }
        }
    }
}
