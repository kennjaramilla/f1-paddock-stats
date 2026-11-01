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
                await s.GetSeasonAsync(year, ct) is { } season
                    ? CsvTable.File(CsvTable.Write(
                        ["Position", "Driver", "Code", "Nationality", "Team", "Points", "Wins", "Podiums", "Poles", "Starts", "Best finish"],
                        season.Drivers.OrderBy(d => d.Position).Select(d => (IReadOnlyList<object?>)
                            [d.Position, d.Name, d.Code, d.Nationality, d.ConstructorName, d.Points, d.Wins, d.Podiums, d.Poles, d.Starts, d.BestFinish])),
                        $"f1-{year}-drivers.csv")
                    : Results.NotFound())
            .WithSummary("Drivers' standings as CSV");

        api.MapGet("/seasons/{year:int}/constructors.csv", async (int year, StatsService s, CancellationToken ct) =>
                await s.GetSeasonAsync(year, ct) is { } season
                    ? CsvTable.File(CsvTable.Write(
                        ["Position", "Team", "Points", "Wins"],
                        season.Constructors.OrderBy(c => c.Position).Select(c => (IReadOnlyList<object?>)
                            [c.Position, c.Name, c.Points, c.Wins])),
                        $"f1-{year}-constructors.csv")
                    : Results.NotFound())
            .WithSummary("Constructors' standings as CSV");

        api.MapGet("/circuits/{id}/races.csv", async (string id, StatsService s, CancellationToken ct) =>
                await s.GetCircuitAsync(id, ct) is { } circuit
                    ? CsvTable.File(CsvTable.Write(
                        ["Season", "Round", "Race", "Winner", "Team", "Grid", "Pole", "Won from pole"],
                        circuit.Races.OrderByDescending(r => r.Season).Select(r => (IReadOnlyList<object?>)
                            [r.Season, r.Round, r.RaceName, r.Winner.Name, r.WinnerTeam.Name, r.WinnerGrid, r.Pole?.Name, r.WonFromPole])),
                        $"f1-{circuit.CircuitId}-winners.csv")
                    : Results.NotFound())
            .WithSummary("Every race and winner at a circuit as CSV");
    }

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
