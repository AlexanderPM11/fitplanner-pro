using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FitPlanner.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace FitPlanner.Api.Services;

public record AuthResult(bool Succeeded, string? Token = null, string? Error = null);

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(string email, string password, string displayName);
    Task<AuthResult> LoginAsync(string email, string password);
    Task<bool> RequestPasswordResetAsync(string email, string frontendUrl);
    Task<IdentityResult> ResetPasswordAsync(string email, string token, string newPassword);
}

public interface IEmailSender
{
    Task SendPasswordResetAsync(string email, string resetUrl);
}

public sealed class AuthService(
    UserManager<ApplicationUser> userManager,
    IConfiguration configuration,
    IEmailSender emailSender) : IAuthService
{
    public async Task<AuthResult> RegisterAsync(string email, string password, string displayName)
    {
        var user = new ApplicationUser { Id = Guid.NewGuid(), UserName = email, Email = email, DisplayName = displayName.Trim() };
        var result = await userManager.CreateAsync(user, password);
        return result.Succeeded ? new(true, await CreateTokenAsync(user)) : new(false, ErrorText(result));
    }

    public async Task<AuthResult> LoginAsync(string email, string password)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null || !await userManager.CheckPasswordAsync(user, password))
            return new(false, Error: "Correo o contraseña incorrectos.");
        return new(true, await CreateTokenAsync(user));
    }

    public async Task<bool> RequestPasswordResetAsync(string email, string frontendUrl)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null) return true; // Avoid exposing whether an account exists.
        var token = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetUrl = $"{frontendUrl.TrimEnd('/')}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
        await emailSender.SendPasswordResetAsync(email, resetUrl);
        return true;
    }

    public async Task<IdentityResult> ResetPasswordAsync(string email, string token, string newPassword)
    {
        var user = await userManager.FindByEmailAsync(email);
        return user is null ? IdentityResult.Failed(new IdentityError { Description = "No se pudo restablecer la contraseña." })
            : await userManager.ResetPasswordAsync(user, token, newPassword);
    }

    private async Task<string> CreateTokenAsync(ApplicationUser user)
    {
        var claims = new List<Claim> { new(JwtRegisteredClaimNames.Sub, user.Id.ToString()), new(ClaimTypes.NameIdentifier, user.Id.ToString()), new(JwtRegisteredClaimNames.Email, user.Email!) };
        claims.AddRange((await userManager.GetRolesAsync(user)).Select(role => new Claim(ClaimTypes.Role, role)));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(configuration["Jwt:Issuer"], configuration["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddDays(7), signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string ErrorText(IdentityResult result) => string.Join(" ", result.Errors.Select(error => error.Description));
}

public sealed class DevelopmentEmailSender(ILogger<DevelopmentEmailSender> logger) : IEmailSender
{
    public Task SendPasswordResetAsync(string email, string resetUrl)
    {
        logger.LogInformation("Password reset email for {Email}: {ResetUrl}", email, resetUrl);
        return Task.CompletedTask;
    }
}
