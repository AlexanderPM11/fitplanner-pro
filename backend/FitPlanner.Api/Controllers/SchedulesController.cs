using System.Security.Claims;
using FitPlanner.Api.Data;
using FitPlanner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitPlanner.Api.Controllers;

[ApiController, Authorize, Route("api/schedules")]
public sealed class SchedulesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var userId = UserId();
        var schedules = await db.Schedules.AsNoTracking().Where(item => item.UserId == userId).Include(item => item.Workout).ToListAsync(cancellationToken);
        var completions = await db.ScheduleCompletions.AsNoTracking().Where(item => item.UserId == userId && item.CompletedAt >= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-7))).ToListAsync(cancellationToken);
        return Ok(new { schedules = schedules.Select(item => new { id = item.Id, workout_id = item.WorkoutId, day_of_week = item.DayOfWeek, workout = new { id = item.Workout.Id, name = item.Workout.Name, description = item.Workout.Description, is_template = item.Workout.IsTemplate, started_at = item.Workout.StartedAtUtc } }), completions = completions.Select(item => new { id = item.Id, schedule_id = item.ScheduleId, completed_at = item.CompletedAt.ToString("yyyy-MM-dd") }) });
    }

    [HttpPost]
    public async Task<IActionResult> Add(AddScheduleRequest request, CancellationToken cancellationToken)
    {
        var exists = await db.Schedules.AnyAsync(item => item.UserId == UserId() && item.WorkoutId == request.WorkoutId && item.DayOfWeek == request.DayOfWeek, cancellationToken);
        if (exists) return Conflict(new { message = "Esta rutina ya está programada para este día." });
        var schedule = new Schedule { UserId = UserId(), WorkoutId = request.WorkoutId, DayOfWeek = request.DayOfWeek }; db.Schedules.Add(schedule); await db.SaveChangesAsync(cancellationToken); return Ok(new { id = schedule.Id });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Remove(Guid id, CancellationToken cancellationToken)
    {
        var schedule = await db.Schedules.SingleOrDefaultAsync(item => item.Id == id && item.UserId == UserId(), cancellationToken); if (schedule is null) return NotFound(); db.Schedules.Remove(schedule); await db.SaveChangesAsync(cancellationToken); return NoContent();
    }

    [HttpPost("{id:guid}/toggle")]
    public async Task<IActionResult> Toggle(Guid id, CancellationToken cancellationToken)
    {
        var userId = UserId(); var today = DateOnly.FromDateTime(DateTime.UtcNow); var existing = await db.ScheduleCompletions.SingleOrDefaultAsync(item => item.UserId == userId && item.ScheduleId == id && item.CompletedAt == today, cancellationToken);
        if (existing is null) { db.ScheduleCompletions.Add(new ScheduleCompletion { UserId = userId, ScheduleId = id, CompletedAt = today }); } else db.ScheduleCompletions.Remove(existing);
        await db.SaveChangesAsync(cancellationToken); return Ok(new { completed = existing is null });
    }

    [HttpDelete("completions")]
    public async Task<IActionResult> ClearCompletions(CancellationToken cancellationToken)
    {
        var items = await db.ScheduleCompletions.Where(item => item.UserId == UserId() && item.CompletedAt >= DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-7))).ToListAsync(cancellationToken);
        db.ScheduleCompletions.RemoveRange(items); await db.SaveChangesAsync(cancellationToken); return NoContent();
    }

    private Guid UserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub")!);
}

public record AddScheduleRequest(Guid WorkoutId, int DayOfWeek);
