using System.Text.Json;
using FitPlanner.Api.Data;
using FitPlanner.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace FitPlanner.Api.Services;

public sealed class RapidApiOptions
{
    public string Key { get; set; } = string.Empty;
    public string Host { get; set; } = "edb-with-gifs-and-images-by-ascendapi.p.rapidapi.com";
    public bool SyncOnStartup { get; set; } = true;
}

public sealed class RapidApiCatalogService(
    IHttpClientFactory httpClientFactory,
    AppDbContext db,
    IOptions<RapidApiOptions> options,
    ILogger<RapidApiCatalogService> logger)
{
    private readonly RapidApiOptions settings = options.Value;

    public async Task SyncAsync(CancellationToken cancellationToken = default)
    {
        if (!settings.SyncOnStartup || string.IsNullOrWhiteSpace(settings.Key))
        {
            logger.LogInformation("RapidAPI sync skipped because no API key is configured.");
            return;
        }

        var client = httpClientFactory.CreateClient("rapidapi");
        using var request = new HttpRequestMessage(HttpMethod.Get, "api/v1/exercises?limit=1500");
        request.Headers.Add("x-rapidapi-key", settings.Key);
        request.Headers.Add("x-rapidapi-host", settings.Host);

        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("RapidAPI returned HTTP {StatusCode}; existing catalog remains available.", (int)response.StatusCode);
            return;
        }

        await using var content = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(content, cancellationToken: cancellationToken);
        var records = document.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Array
            ? data.EnumerateArray()
            : document.RootElement.ValueKind == JsonValueKind.Array ? document.RootElement.EnumerateArray() : [];

        var remote = records.Select(Parse).Where(item => item is not null).Cast<RemoteExercise>().ToList();
        if (remote.Count == 0) return;

        var existing = await db.Exercises.Where(item => item.Source == "rapidapi").ToListAsync(cancellationToken);
        var byExternalId = existing.ToDictionary(item => item.ExternalId!, StringComparer.OrdinalIgnoreCase);

        foreach (var item in remote)
        {
            if (!byExternalId.TryGetValue(item.ExternalId, out var exercise))
            {
                exercise = new Exercise { ExternalId = item.ExternalId, Source = "rapidapi" };
                db.Exercises.Add(exercise);
                byExternalId[item.ExternalId] = exercise;
            }

            exercise.Name = item.Name;
            exercise.Category = item.Category;
            exercise.Description = item.Description;
            exercise.Equipment = item.Equipment;
            exercise.MovementType = item.MovementType;
            exercise.ImageUrl = item.ImageUrl;
            exercise.VideoUrl = item.GifUrl ?? item.VideoUrl;
        }

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("RapidAPI catalog synchronized: {Count} exercises.", remote.Count);
    }

    public async Task<RapidApiExerciseDetails?> GetDetailsAsync(string externalId, CancellationToken cancellationToken = default)
    {
        if (!settings.SyncOnStartup || string.IsNullOrWhiteSpace(settings.Key) || string.IsNullOrWhiteSpace(externalId))
            return null;

        var client = httpClientFactory.CreateClient("rapidapi");
        using var request = new HttpRequestMessage(HttpMethod.Get, $"api/v1/exercises/{Uri.EscapeDataString(externalId)}");
        request.Headers.Add("x-rapidapi-key", settings.Key);
        request.Headers.Add("x-rapidapi-host", settings.Host);

        using var response = await client.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning("RapidAPI detail request returned HTTP {StatusCode} for {ExternalId}.", (int)response.StatusCode, externalId);
            return null;
        }

        await using var content = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(content, cancellationToken: cancellationToken);
        var item = document.RootElement.TryGetProperty("data", out var data) && data.ValueKind == JsonValueKind.Object
            ? data
            : document.RootElement;
        var parsed = Parse(item);
        return parsed is null ? null : new RapidApiExerciseDetails(parsed.ExternalId, parsed.Name, parsed.Category, parsed.Description, parsed.Equipment, parsed.MovementType, parsed.ImageUrl, parsed.GifUrl, parsed.VideoUrl, ArrayValue(item, "instructions").ToList());
    }

    private static RemoteExercise? Parse(JsonElement item)
    {
        var externalId = StringValue(item, "exerciseId") ?? StringValue(item, "id");
        var name = StringValue(item, "name");
        if (string.IsNullOrWhiteSpace(externalId) || string.IsNullOrWhiteSpace(name)) return null;

        var bodyPart = ArrayValue(item, "bodyParts", "body_parts").FirstOrDefault() ?? StringValue(item, "bodyPart") ?? "Full Body";
        var equipment = ArrayValue(item, "equipments", "equipment").FirstOrDefault() ?? "body weight";
        var instructions = ArrayValue(item, "instructions");
        var imageUrl = StringValue(item, "imageUrl") ?? NestedString(item, "imageUrls", "480p") ?? NestedFirstString(item, "imageUrls");
        var gifUrl = StringValue(item, "gifUrl") ?? NestedString(item, "gifUrls", "180p") ?? NestedFirstString(item, "gifUrls");
        var videoUrl = StringValue(item, "videoUrl");
        var category = TranslateCategory(bodyPart);
        return new RemoteExercise(externalId, name, category, instructions.FirstOrDefault() ?? StringValue(item, "overview"), equipment, StringValue(item, "exerciseType"), imageUrl, gifUrl, videoUrl);
    }

    private static string? StringValue(JsonElement item, string name) => item.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    private static string? NestedString(JsonElement item, string objectName, string propertyName) => item.TryGetProperty(objectName, out var value) && value.ValueKind == JsonValueKind.Object && value.TryGetProperty(propertyName, out var nested) ? nested.GetString() : null;
    private static string? NestedFirstString(JsonElement item, string objectName) => item.TryGetProperty(objectName, out var value) && value.ValueKind == JsonValueKind.Object ? value.EnumerateObject().Select(property => property.Value.GetString()).FirstOrDefault() : null;
    private static IEnumerable<string> ArrayValue(JsonElement item, params string[] names) => names.Select(name => item.TryGetProperty(name, out var value) ? value : default).Where(value => value.ValueKind == JsonValueKind.Array).SelectMany(value => value.EnumerateArray()).Where(value => value.ValueKind == JsonValueKind.String).Select(value => value.GetString()!).Where(value => !string.IsNullOrWhiteSpace(value));
    private static string TranslateCategory(string category) => category.ToUpperInvariant() switch { "CHEST" => "Pecho", "BACK" => "Espalda", "SHOULDERS" => "Hombros", "LEGS" or "UPPER LEGS" => "Piernas", "WAIST" => "Abdomen", "UPPER ARMS" or "BICEPS" or "TRICEPS" => "Brazos", _ => "Cuerpo Completo" };
    private sealed record RemoteExercise(string ExternalId, string Name, string Category, string? Description, string? Equipment, string? MovementType, string? ImageUrl, string? GifUrl, string? VideoUrl);
}

public sealed record RapidApiExerciseDetails(string ExternalId, string Name, string Category, string? Description, string? Equipment, string? MovementType, string? ImageUrl, string? GifUrl, string? VideoUrl, List<string> Instructions);
