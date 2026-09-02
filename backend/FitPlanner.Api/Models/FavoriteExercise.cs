namespace FitPlanner.Api.Models;

public sealed class FavoriteExercise
{
    public Guid UserId { get; set; }
    public Guid ExerciseId { get; set; }
}
