using FitPlanner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitPlanner.Api.Controllers;

[ApiController, Authorize(Roles = "Admin"), Route("api/admin")]
public sealed class AdminController(UserManager<ApplicationUser> users) : ControllerBase
{
    [HttpGet("users")]
    public async Task<IReadOnlyList<AdminUserResponse>> Users(CancellationToken cancellationToken) => await users.Users
        .AsNoTracking()
        .OrderByDescending(user => user.CreatedAtUtc)
        .Select(user => new AdminUserResponse(user.Id, user.Email!, user.DisplayName, user.CreatedAtUtc, user.EmailConfirmed))
        .ToListAsync(cancellationToken);
}

public record AdminUserResponse(Guid Id, string Email, string DisplayName, DateTime CreatedAtUtc, bool EmailConfirmed);
