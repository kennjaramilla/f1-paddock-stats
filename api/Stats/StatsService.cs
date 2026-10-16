using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PaddockStats.Api.Data;

namespace PaddockStats.Api.Stats;

/// <summary>Read side of the API: loads the (small) dataset once, then serves aggregations from memory.</summary>
public class StatsService(PaddockDbContext db, IMemoryCache cache, TimeProvider clock)
{
    private const string DatasetKey = "dataset";

    public async Task<Meta> GetMetaAsync(CancellationToken ct)
    {
        var ds = await GetDatasetAsync(ct);
        var years = Years(ds);
        return new Meta(clock.GetUtcNow().ToString("O"), "Jolpica-F1 (Ergast-compatible)",
            years.FirstOrDefault(), years.LastOrDefault(), ds.Races.Count, ds.Drivers.Count, ds.Circuits.Count);
    }

    public async Task<List<SeasonIndexItem>> GetSeasonsAsync(CancellationToken ct)
    {
        var ds = await GetDatasetAsync(ct);
        return Years(ds).Select(y => StatsCalculator.SeasonIndex(StatsCalculator.Season(ds, y))).OrderByDescending(s => s.Year).ToList();
    }

    public async Task<SeasonDetail?> GetSeasonAsync(int year, CancellationToken ct)
    {
        var ds = await GetDatasetAsync(ct);
        return Years(ds).Contains(year) ? StatsCalculator.Season(ds, year) : null;
    }

    public async Task<SeasonResults?> GetSeasonResultsAsync(int year, CancellationToken ct)
    {
        var ds = await GetDatasetAsync(ct);
        return Years(ds).Contains(year) ? StatsCalculator.SeasonResults(ds, year) : null;
    }

    public async Task<List<DriverIndexItem>> GetDriversAsync(CancellationToken ct)
    {
        var ds = await GetDatasetAsync(ct);
        return StatsCalculator.DriverIndex(ds, Years(ds).Select(y => StatsCalculator.Season(ds, y)).ToList());
    }

    public async Task<List<ConstructorIndexItem>> GetConstructorsAsync(CancellationToken ct) =>
        StatsCalculator.ConstructorIndex(await GetDatasetAsync(ct));

    public async Task<List<CircuitIndexItem>> GetCircuitsAsync(CancellationToken ct) =>
        StatsCalculator.CircuitIndex(await GetDatasetAsync(ct));

    public async Task<CircuitDetail?> GetCircuitAsync(string id, CancellationToken ct) =>
        StatsCalculator.Circuit(await GetDatasetAsync(ct), id);

    public async Task<IReadOnlyList<int>> GetYearsAsync(CancellationToken ct) => Years(await GetDatasetAsync(ct));

    /// <summary>Called after ingestion so the next request sees fresh data.</summary>
    public void Invalidate() => cache.Remove(DatasetKey);

    private async Task<Dataset> GetDatasetAsync(CancellationToken ct) =>
        (await cache.GetOrCreateAsync(DatasetKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);
            return new Dataset(
                await db.Races.AsNoTracking().ToListAsync(ct),
                await db.Results.AsNoTracking().ToListAsync(ct),
                await db.Qualifying.AsNoTracking().ToListAsync(ct),
                await db.Drivers.AsNoTracking().ToDictionaryAsync(d => d.DriverId, ct),
                await db.Constructors.AsNoTracking().ToDictionaryAsync(c => c.ConstructorId, ct),
                await db.Circuits.AsNoTracking().ToDictionaryAsync(c => c.CircuitId, ct),
                await db.OfficialStandings.AsNoTracking().ToListAsync(ct),
                clock.GetUtcNow().Year);
        }))!;

    private static IReadOnlyList<int> Years(Dataset ds) => ds.Races.Select(r => r.Season).Distinct().Order().ToList();
}
