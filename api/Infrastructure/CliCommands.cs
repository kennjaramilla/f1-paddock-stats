using Microsoft.EntityFrameworkCore;
using PaddockStats.Api.Data;
using PaddockStats.Api.Export;
using PaddockStats.Api.Ingestion;

namespace PaddockStats.Api.Infrastructure;

public static class CliCommands
{
    public static async Task RunAsync(IServiceProvider services, string[] args)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        await sp.GetRequiredService<PaddockDbContext>().Database.EnsureCreatedAsync();

        if (args[0] == "ingest")
        {
            var from = args.Length > 1 ? int.Parse(args[1]) : 2014;
            var to = args.Length > 2 ? int.Parse(args[2]) : DateTime.UtcNow.Year;
            await sp.GetRequiredService<IngestionService>().IngestRangeAsync(from, to, CancellationToken.None);
        }
        else
        {
            var dir = args.Length > 1 ? args[1] : Path.Combine("..", "web", "public", "data");
            await sp.GetRequiredService<SnapshotExporter>().ExportAsync(Path.GetFullPath(dir), CancellationToken.None);
        }
    }
}
