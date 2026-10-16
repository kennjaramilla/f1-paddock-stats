using Microsoft.EntityFrameworkCore;
using PaddockStats.Api.Data;

namespace PaddockStats.Api.Infrastructure;

public static class DatabaseSetup
{
    /// <summary>
    /// SQLite file from config. If it doesn't exist yet (fresh Docker volume), the committed seed DB is copied in,
    /// so the API starts with data and never needs Jolpica at boot.
    /// </summary>
    public static IServiceCollection AddPaddockDatabase(this IServiceCollection services, IConfiguration config, IHostEnvironment env)
    {
        var path = config["Database:Path"] ?? Path.Combine(env.ContentRootPath, "paddock.db");
        var readOnly = config.GetValue<bool>("Database:ReadOnly");
        var seed = Path.Combine(AppContext.BaseDirectory, "seed", "paddock.db");
        if (!File.Exists(path) && File.Exists(seed) && !readOnly)
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
            File.Copy(seed, path);
        }
        var connection = readOnly ? $"Data Source={(File.Exists(path) ? path : seed)};Mode=ReadOnly" : $"Data Source={path}";
        services.AddDbContext<PaddockDbContext>(o => o.UseSqlite(connection));
        return services;
    }
}
