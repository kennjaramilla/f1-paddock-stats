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
            await s.GetSeasonResultsAsync(year, ct) is { } results ? Results.Ok(results) : Results.NotFound());
        api.MapGet("/drivers", (StatsService s, CancellationToken ct) => s.GetDriversAsync(ct));
        api.MapGet("/constructors", (StatsService s, CancellationToken ct) => s.GetConstructorsAsync(ct));
        api.MapGet("/circuits", (StatsService s, CancellationToken ct) => s.GetCircuitsAsync(ct));
        api.MapGet("/circuits/{id}", async (string id, StatsService s, CancellationToken ct) =>
            await s.GetCircuitAsync(id, ct) is { } circuit ? Results.Ok(circuit) : Results.NotFound());

        return api;
    }

    public static RouteGroupBuilder MapAdminApi(this IEndpointRouteBuilder app)
    {
        var admin = app.MapGroup("/api/admin").WithTags("Admin");

        admin.MapPost("/seasons/{year:int}/refresh", async (int year, IngestionService ingest, StatsService stats, CancellationToken ct) =>
        {
            await ingest.IngestSeasonAsync(year, ct);
            stats.Invalidate();
            return Results.NoContent();
        });

        return admin;
    }
}
