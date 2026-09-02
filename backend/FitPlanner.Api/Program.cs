using System.Text;
using FitPlanner.Api.Data;
using FitPlanner.Api.Models;
using FitPlanner.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is required.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

builder.Services.AddIdentityCore<ApplicationUser>(options =>
{
    options.User.RequireUniqueEmail = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireDigit = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddRoles<IdentityRole<Guid>>()
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is required.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1)
    });

builder.Services.AddAuthorization();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailSender, DevelopmentEmailSender>();
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddCors(options => options.AddPolicy("frontend", policy => policy
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:5173"])
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();

await ApplyMigrationsAsync(app.Services);
await ExerciseCatalogSeeder.SeedAsync(app.Services, app.Environment);
await SeedAdministratorAsync(app.Services, app.Configuration);

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();

app.Run();

static async Task ApplyMigrationsAsync(IServiceProvider services)
{
    const int maxAttempts = 10;
    using var scope = services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    for (var attempt = 1; ; attempt++)
    {
        try
        {
            await db.Database.MigrateAsync();
            return;
        }
        catch when (attempt < maxAttempts)
        {
            await Task.Delay(TimeSpan.FromSeconds(5));
        }
    }
}

static async Task SeedAdministratorAsync(IServiceProvider services, IConfiguration configuration)
{
    var email = configuration["Admin:Email"]?.Trim();
    var password = configuration["Admin:Password"];
    if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        throw new InvalidOperationException("Admin:Email and Admin:Password are required.");

    using var scope = services.CreateScope();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    if (!await roleManager.RoleExistsAsync("Admin"))
    {
        var roleResult = await roleManager.CreateAsync(new IdentityRole<Guid>("Admin"));
        if (!roleResult.Succeeded) throw new InvalidOperationException(string.Join(" ", roleResult.Errors.Select(error => error.Description)));
    }

    var admin = await userManager.FindByEmailAsync(email);
    if (admin is null)
    {
        admin = new ApplicationUser { Id = Guid.NewGuid(), UserName = email, Email = email, EmailConfirmed = true, DisplayName = "Administrador" };
        var userResult = await userManager.CreateAsync(admin, password);
        if (!userResult.Succeeded) throw new InvalidOperationException(string.Join(" ", userResult.Errors.Select(error => error.Description)));
    }

    if (!await userManager.IsInRoleAsync(admin, "Admin"))
    {
        var roleResult = await userManager.AddToRoleAsync(admin, "Admin");
        if (!roleResult.Succeeded) throw new InvalidOperationException(string.Join(" ", roleResult.Errors.Select(error => error.Description)));
    }
}
