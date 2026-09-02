using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FitPlanner.Api.Data;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseMySql("server=localhost;database=fitplanner;user=root;password=development", new MySqlServerVersion(new Version(8, 0, 0)))
            .Options;
        return new AppDbContext(options);
    }
}
