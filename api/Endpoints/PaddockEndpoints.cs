using PaddockStats.Api.Csv;
using PaddockStats.Api.Ingestion;
using PaddockStats.Api.Infrastructure;
using PaddockStats.Api.Stats;

namespace PaddockStats.Api.Endpoints;

public static class PaddockEndpoints
{
    /// <summary>Read-only stats API. Routes mirror the snapshot layout (/api/x → /data/x.json).</summary>
    public static RouteGroupBuilder MapPaddockApi(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api").WithTags("Paddock").RequireRateLimiting(RateLimits.Api);

        api.MapGet("/meta", (StatsService s, CancellationToken ct) => s.GetMetaAsync(ct));
        api.MapGet("/seasons", (StatsService s, CancellationToken ct) => s.GetSeasonsAsync(ct));
        api.MapGet("/seasons/{year:int}", async (int year, StatsService s, CancellationToken ct) =>
            await s.GetSeasonAsync(year, ct) is { } season ? Results.Ok(season) : Results.NotFound());
        api.MapGet("/seasons/{year:int}/results", async (int year, StatsService s, CancellationToken ct) =>
            await s.GetSeasonResultsAsync(year, ct) is { } results ? Results.Ok(results) : Results.NotFound())
            .RequireAuthorization(Policies.Analyst); // race-by-race data powers head-to-head
        api.MapGet("/drivers", (StatsService s, CancellationToken ct) => s.GetDriversAsync(ct));
        api.MapGet("/constructors", (StatsService s, CancellationToken ct) => s.GetConstructorsAsync(ct));
        api.MapGet("/circuits", (StatsService s, CancellationToken ct) => s.GetCircuitsAsync(ct));
        api.MapGet("/circuits/{id}", async (string id, StatsService s, CancellationToken ct) =>
            await s.GetCircuitAsync(id, ct) is { } circuit ? Results.Ok(circuit) : Results.NotFound());

        MapCsv(api);
        return api;
    }

    /// <summary>CSV twins of the chart tables, same access as their JSON (all public).</summary>
    private static void MapCsv(RouteGroupBuilder api)
    {
        api.MapGet("/seasons/{year:int}/drivers.csv", async (int year, StatsService s, CancellationToken ct) =>
                await s.GetSeasonAsync(year, ct) is { } season ? Download(CsvExports.Drivers(year, season)) : Results.NotFound())
            .WithSummary("Drivers' standings as CSV");

        api.MapGet("/seasons/{year:int}/constructors.csv", async (int year, StatsService s, CancellationToken ct) =>
                await s.GetSeasonAsync(year, ct) is { } season ? Download(CsvExports.Constructors(year, season)) : Results.NotFound())
            .WithSummary("Constructors' standings as CSV");

        api.MapGet("/circuits/{id}/races.csv", async (string id, StatsService s, CancellationToken ct) =>
                await s.GetCircuitAsync(id, ct) is { } circuit ? Download(CsvExports.CircuitRaces(circuit)) : Results.NotFound())
            .WithSummary("Every race and winner at a circuit as CSV");
    }

    private static IResult Download(CsvExports.CsvFile file) => CsvTable.File(file.Csv, file.FileName);

    public static RouteGroupBuilder MapAdminApi(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/admin").WithTags("Admin").RequireAuthorization(Policies.Admin);

        admin.MapPost("/seasons/{year:int}/refresh", async (int year, IngestionService ingest, StatsService stats, CancellationToken ct) =>
        {
            await ingest.IngestSeasonAsync(year, ct);
            stats.Invalidate();
            return Results.NoContent();
        });

        return admin;
    }
}
