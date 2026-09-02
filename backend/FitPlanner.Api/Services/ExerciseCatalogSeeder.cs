using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using FitPlanner.Api.Data;
using FitPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FitPlanner.Api.Services;

public static class ExerciseCatalogSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IWebHostEnvironment environment, CancellationToken cancellationToken = default)
    {
        var catalogPath = Path.Combine(AppContext.BaseDirectory, "Data", "exercise-catalog.json");
        if (!File.Exists(catalogPath)) return;

        await using var stream = File.OpenRead(catalogPath);
        var catalog = await JsonSerializer.DeserializeAsync<List<CatalogExercise>>(stream, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }, cancellationToken) ?? [];
        if (catalog.Count == 0) return;

        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var existing = await db.Exercises.ToListAsync(cancellationToken);
        var byName = existing.ToDictionary(item => item.Name, StringComparer.OrdinalIgnoreCase);

        foreach (var item in catalog)
        {
            var name = item.Name.Trim();
            if (string.IsNullOrWhiteSpace(name)) continue;
            if (!byName.TryGetValue(name, out var exercise))
            {
                exercise = new Exercise { Id = StableId(item.SourceId), Name = name };
                db.Exercises.Add(exercise);
                byName[name] = exercise;
            }

            exercise.Category = string.IsNullOrWhiteSpace(item.Category) ? "Cuerpo Completo" : item.Category;
            exercise.Description = item.Description;
            exercise.Equipment = item.Equipment;
            exercise.MovementType = item.MovementType;
            exercise.ImageUrl = item.ImageUrl;
            exercise.VideoUrl = item.VideoUrl;
        }

        await UpgradeLegacyExercisesAsync(db, existing, catalog, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task UpgradeLegacyExercisesAsync(AppDbContext db, List<Exercise> existing, List<CatalogExercise> catalog, CancellationToken cancellationToken)
    {
        var legacyNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Press de banca", "Sentadilla", "Peso muerto", "Dominadas", "Press militar"
        };
        var legacy = existing.Where(item =>
            (item.ImageUrl?.StartsWith("/exercise-media/", StringComparison.OrdinalIgnoreCase) == true
                && item.ImageUrl.StartsWith("/exercise-media/images/", StringComparison.OrdinalIgnoreCase) == false)
            || (string.IsNullOrWhiteSpace(item.VideoUrl) && legacyNames.Contains(item.Name))).ToList();
        if (legacy.Count == 0) return;

        var legacyIds = legacy.Select(item => item.Id).ToArray();
        var referencedIds = (await db.Set<WorkoutExercise>().AsNoTracking().Select(item => item.ExerciseId).ToListAsync(cancellationToken))
            .Where(legacyIds.Contains).ToHashSet();
        var favoriteIds = (await db.Set<FavoriteExercise>().AsNoTracking().Select(item => item.ExerciseId).ToListAsync(cancellationToken))
            .Where(legacyIds.Contains).ToHashSet();

        foreach (var exercise in legacy)
        {
            var replacement = FindReplacement(exercise, catalog);
            if (replacement is null)
            {
                if (!referencedIds.Contains(exercise.Id) && !favoriteIds.Contains(exercise.Id)) db.Exercises.Remove(exercise);
                continue;
            }

            exercise.ImageUrl = replacement.ImageUrl;
            exercise.VideoUrl = replacement.VideoUrl;
            if (!referencedIds.Contains(exercise.Id) && !favoriteIds.Contains(exercise.Id)) db.Exercises.Remove(exercise);
        }
    }

    private static CatalogExercise? FindReplacement(Exercise exercise, List<CatalogExercise> catalog)
    {
        var name = Normalize(exercise.Name);
        var aliases = new[]
        {
            (new[] { "press de banca", "bench press" }, "bench press"),
            (new[] { "sentadilla", "squat" }, "squat"),
            (new[] { "peso muerto", "deadlift" }, "deadlift"),
            (new[] { "dominadas", "pull up", "pull-up" }, "pull up"),
            (new[] { "press militar", "military press", "overhead press" }, "overhead press")
        };
        var alias = aliases.FirstOrDefault(item => item.Item1.Any(name.Contains)).Item2;
        var candidate = string.IsNullOrWhiteSpace(alias) ? null : catalog.FirstOrDefault(item => Normalize(item.Name).Contains(alias));
        candidate ??= catalog.FirstOrDefault(item => Normalize(item.Name) == name);
        candidate ??= catalog.FirstOrDefault(item => Normalize(item.Category) == Normalize(exercise.Category));
        return candidate;
    }

    private static string Normalize(string value) => value.Trim().ToLowerInvariant().Replace("-", " ");

    private static Guid StableId(string sourceId)
    {
        var bytes = MD5.HashData(Encoding.UTF8.GetBytes($"exercises-dataset:{sourceId}"));
        return new Guid(bytes);
    }

    private sealed record CatalogExercise(string SourceId, string Name, string Category, string? Description, string? Equipment, string? MovementType, string? ImageUrl, string? VideoUrl);
}
