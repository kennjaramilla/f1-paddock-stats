using System.Text.Json;
using PaddockStats.Api.Stats;

namespace PaddockStats.Api.Export;

/// <summary>Writes every GET response to /data/{route}.json so the web app can run without the API.</summary>
public class SnapshotExporter(StatsService stats, ILogger<SnapshotExporter> logger)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task ExportAsync(string outDir, CancellationToken ct)
    {
        await WriteAsync(outDir, "meta", await stats.GetMetaAsync(ct), ct);
        await WriteAsync(outDir, "seasons", await stats.GetSeasonsAsync(ct), ct);

        var unreconciled = new List<int>();
        foreach (var year in await stats.GetYearsAsync(ct))
        {
            var season = (await stats.GetSeasonAsync(year, ct))!;
            if (!season.Reconciliation.Matches) unreconciled.Add(year);
            await WriteAsync(outDir, $"seasons/{year}", season, ct);
            await WriteAsync(outDir, $"seasons/{year}/results", await stats.GetSeasonResultsAsync(year, ct), ct);
        }

        await WriteAsync(outDir, "drivers", await stats.GetDriversAsync(ct), ct);
        await WriteAsync(outDir, "constructors", await stats.GetConstructorsAsync(ct), ct);
        var circuits = await stats.GetCircuitsAsync(ct);
        await WriteAsync(outDir, "circuits", circuits, ct);
        foreach (var c in circuits)
            await WriteAsync(outDir, $"circuits/{c.CircuitId}", await stats.GetCircuitAsync(c.CircuitId, ct), ct);

        logger.LogInformation("Exported snapshot to {Dir}; unreconciled seasons: {Unreconciled}",
            outDir, unreconciled.Count == 0 ? "none" : string.Join(",", unreconciled));
    }

    private static async Task WriteAsync<T>(string outDir, string route, T body, CancellationToken ct)
    {
        var path = Path.Combine(outDir, route + ".json");
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var file = File.Create(path);
        await JsonSerializer.SerializeAsync(file, body, Json, ct);
    }
}
