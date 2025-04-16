using System;
using CleanArchitecture.Core.DTOs.Account;
using CleanArchitecture.Core.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration; // IConfiguration için eklendi
using System.Collections.Generic;     // List<string> için eklendi
using Microsoft.Extensions.Logging; // ILogger için eklendi

namespace CleanArchitecture.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly IConfiguration _configuration; // Configuration eklendi
        private readonly ILogger<AccountController> _logger; // Logger eklendi
        private readonly List<string> _allowedOriginsForAccountActions; // İzin verilen origin listesi

        public AccountController(IAccountService accountService, IConfiguration configuration, ILogger<AccountController> logger)
        {
            _accountService = accountService;
            _configuration = configuration;
            _logger = logger;
            // appsettings'den izin verilen origin'leri oku
            _allowedOriginsForAccountActions = _configuration.GetSection("SecuritySettings:AllowedOriginsForAccountActions").Get<List<string>>() ?? new List<string>();
             _logger.LogInformation("Allowed origins for account actions loaded: {Origins}", string.Join(", ", _allowedOriginsForAccountActions));
        }

        [HttpPost("authenticate")]
        public async Task<IActionResult> AuthenticateAsync(AuthenticationRequest request)
        {
            // Try-catch bloğu AccountService veya ErrorHandlerMiddleware tarafından ele alınabilir.
            // Burada bırakmakta sorun yok, ama merkezi hata yönetimi tercih edilebilir.
            var result = await _accountService.AuthenticateAsync(request, GenerateIPAddress());
            return Ok(result);
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterAsync(RegisterRequest request)
        {
            // Register için origin genellikle frontend'den gelir ve doğrulamaya gerek olmayabilir
            // ama gerekirse ForgotPassword'daki gibi kontrol edilebilir.
            var origin = GetValidOrigin() ?? "https://localhost:9001"; // Varsayılan veya ilk geçerli origin
             _logger.LogInformation("Registration attempt from origin: {Origin}", origin);
            return Ok(await _accountService.RegisterAsync(request, origin));
        }

        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmailAsync([FromQuery] string userId, [FromQuery] string code)
        {
            // E-posta doğrulama linki genellikle origin bilgisi taşımaz, bu yüzden burada origin kontrolü gereksiz olabilir.
            // Linkin kendisi zaten benzersiz token içerir.
            _logger.LogInformation("ConfirmEmail attempt for User ID: {UserId}", userId);
            return Ok(await _accountService.ConfirmEmailAsync(userId, code));
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest model)
        {
            var origin = GetValidOrigin();
            if (origin == null)
            {
                _logger.LogWarning("ForgotPassword request rejected due to invalid or missing origin header from allowed list.");
                return BadRequest("Invalid request origin.");
            }
            _logger.LogInformation("ForgotPassword request received from valid origin: {Origin} for Email: {Email}", origin, model.Email);
            // EmailRequest döndürmek yerine sadece OK döndürmek daha güvenli olabilir (eposta gönderildi mesajı).
            // Hassas bilgiyi (reset token gibi) yanıtta döndürmekten kaçının.
            await _accountService.ForgotPassword(model, origin);
            return Ok("If an account with this email exists, a password reset email has been sent."); // Daha güvenli yanıt
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest model)
        {
             _logger.LogInformation("ResetPassword attempt for Email: {Email}", model.Email);
            return Ok(await _accountService.ResetPassword(model));
        }

        private string GetValidOrigin()
        {
            var originHeader = Request.Headers["Origin"].FirstOrDefault();
             _logger.LogDebug("Received Origin header: {OriginHeader}", originHeader);

            if (string.IsNullOrEmpty(originHeader))
            {
                 _logger.LogDebug("Origin header is missing.");
                return null; // Origin başlığı yoksa reddet
            }

            // Geliştirme ortamında daha esnek olabilirsiniz (opsiyonel)
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" && _allowedOriginsForAccountActions.Contains(originHeader, StringComparer.OrdinalIgnoreCase))
            {
                 _logger.LogDebug("Development environment: Allowing origin {OriginHeader} as it's in the allowed list.", originHeader);
                return originHeader;
            }


            if (_allowedOriginsForAccountActions.Contains(originHeader, StringComparer.OrdinalIgnoreCase))
            {
                _logger.LogDebug("Origin {OriginHeader} found in the allowed list.", originHeader);
                return originHeader;
            }
            else
            {
                _logger.LogWarning("Origin {OriginHeader} is NOT in the allowed list: {AllowedList}", originHeader, string.Join(", ", _allowedOriginsForAccountActions));
                return null; // İzin verilenler listesinde yoksa reddet
            }
        }


        private string GenerateIPAddress()
        {
            // X-Forwarded-For başlığını kontrol et (Proxy/Load Balancer arkasındaysa)
            if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwardedFor))
            {
                // İlk IP adresi genellikle client IP'sidir
                var ip = forwardedFor.FirstOrDefault()?.Split(',').Select(s => s.Trim()).FirstOrDefault();
                 _logger.LogDebug("Using IP from X-Forwarded-For: {IP}", ip);
                if(!string.IsNullOrEmpty(ip)) return ip;
            }

            // Doğrudan bağlantı IP'si
            var remoteIp = HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString();
            _logger.LogDebug("Using IP from RemoteIpAddress: {IP}", remoteIp);
            return remoteIp ?? "UNKNOWN";
        }
    }
}