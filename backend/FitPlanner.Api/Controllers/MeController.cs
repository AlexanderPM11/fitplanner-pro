using System.Security.Claims;
using FitPlanner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace FitPlanner.Api.Controllers;

[ApiController, Authorize, Route("api/me")]
public sealed class MeController(UserManager<ApplicationUser> users) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get() { var user = await users.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!); return user is null ? NotFound() : Ok(new { id = user.Id, email = user.Email, full_name = user.DisplayName, created_at = user.CreatedAtUtc, is_admin = User.IsInRole("Admin") }); }

    [HttpPut]
    public async Task<IActionResult> Update(UpdateProfileRequest request) { var user = await users.FindByIdAsync(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!); if (user is null) return NotFound(); user.DisplayName = request.FullName.Trim(); await users.UpdateAsync(user); return Ok(new { full_name = user.DisplayName }); }
}

public record UpdateProfileRequest(string FullName);
