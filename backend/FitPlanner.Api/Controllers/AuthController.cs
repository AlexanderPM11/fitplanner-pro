using FitPlanner.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FitPlanner.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [AllowAnonymous, HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request) => Result(await authService.RegisterAsync(request.Email, request.Password, request.DisplayName));

    [AllowAnonymous, HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request) => Result(await authService.LoginAsync(request.Email, request.Password));

    [AllowAnonymous, HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        await authService.RequestPasswordResetAsync(request.Email, request.FrontendUrl);
        return Ok(new { message = "Si existe una cuenta con ese correo, recibirás instrucciones para restablecerla." });
    }

    [AllowAnonymous, HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var result = await authService.ResetPasswordAsync(request.Email, request.Token, request.NewPassword);
        return result.Succeeded ? Ok(new { message = "Contraseña actualizada." }) : BadRequest(new { errors = result.Errors.Select(error => error.Description) });
    }

    private IActionResult Result(AuthResult result) => result.Succeeded ? Ok(new { token = result.Token }) : BadRequest(new { message = result.Error });
}

public record RegisterRequest(string Email, string Password, string DisplayName);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email, string FrontendUrl);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
