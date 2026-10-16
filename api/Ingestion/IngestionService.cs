using System.Globalization;
using Microsoft.EntityFrameworkCore;
using PaddockStats.Api.Data;
using PaddockStats.Api.Jolpica;

namespace PaddockStats.Api.Ingestion;

public class IngestionService(PaddockDbContext db, JolpicaClient jolpica, ILogger<IngestionService> logger)
{
    public async Task IngestRangeAsync(int from, int to, CancellationToken ct)
    {
        for (var season = from; season <= to; season++)
            await IngestSeasonAsync(season, ct);
    }

    /// <summary>Replaces one season's rows; safe to re-run.</summary>
    public async Task IngestSeasonAsync(int season, CancellationToken ct)
    {
        logger.LogInformation("Ingesting {Season}", season);
        var results = await jolpica.GetResultsAsync(season, ct);
        var sprints = await jolpica.GetSprintAsync(season, ct);
        var quali = await jolpica.GetQualifyingAsync(season, ct);
        var standings = await jolpica.GetDriverStandingsAsync(season, ct);

        if (results.Count == 0)
        {
            logger.LogWarning("No results for {Season}; skipping", season);
            return;
        }

        await using var tx = await db.Database.BeginTransactionAsync(ct);
        var raceIds = await db.Races.Where(r => r.Season == season).Select(r => r.Id).ToListAsync(ct);
        await db.Results.Where(r => raceIds.Contains(r.RaceId)).ExecuteDeleteAsync(ct);
        await db.Qualifying.Where(q => raceIds.Contains(q.RaceId)).ExecuteDeleteAsync(ct);
        await db.OfficialStandings.Where(s => s.Season == season).ExecuteDeleteAsync(ct);
        await db.Races.Where(r => r.Season == season).ExecuteDeleteAsync(ct);

        var drivers = await db.Drivers.ToDictionaryAsync(d => d.DriverId, ct);
        var constructors = await db.Constructors.ToDictionaryAsync(c => c.ConstructorId, ct);
        var circuits = await db.Circuits.ToDictionaryAsync(c => c.CircuitId, ct);
        var sprintRounds = sprints.Select(s => s.Round).ToHashSet();

        foreach (var jr in results)
        {
            var raceId = season * 100 + int.Parse(jr.Round);
            UpsertCircuit(circuits, jr.Circuit);
            db.Races.Add(new Race
            {
                Id = raceId, Season = season, Round = int.Parse(jr.Round), Name = jr.RaceName,
                CircuitId = jr.Circuit.CircuitId, Date = jr.Date, HasSprint = sprintRounds.Contains(jr.Round),
            });
            AddResults(raceId, SessionKind.Race, jr.Results, drivers, constructors);
        }

        var raceIdSet = results.Select(r => season * 100 + int.Parse(r.Round)).ToHashSet();
        foreach (var js in sprints)
        {
            var raceId = season * 100 + int.Parse(js.Round);
            if (raceIdSet.Contains(raceId)) AddResults(raceId, SessionKind.Sprint, js.SprintResults, drivers, constructors);
        }

        foreach (var jq in quali)
        {
            var raceId = season * 100 + int.Parse(jq.Round);
            if (!raceIdSet.Contains(raceId)) continue;
            foreach (var q in jq.QualifyingResults ?? [])
            {
                UpsertDriver(drivers, q.Driver);
                UpsertConstructor(constructors, q.Constructor);
                db.Qualifying.Add(new QualifyingResult
                {
                    RaceId = raceId, DriverId = q.Driver.DriverId, ConstructorId = q.Constructor.ConstructorId,
                    Position = int.Parse(q.Position),
                });
            }
        }

        if (standings is not null)
        {
            foreach (var s in standings.DriverStandings)
            {
                UpsertDriver(drivers, s.Driver);
                db.OfficialStandings.Add(new OfficialStanding
                {
                    Season = season, Round = int.Parse(standings.Round), DriverId = s.Driver.DriverId,
                    // Position can be missing for excluded drivers.
                    Position = int.TryParse(s.Position, out var p) ? p : 0,
                    Points = ParseDouble(s.Points), Wins = int.Parse(s.Wins),
                });
            }
        }

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        logger.LogInformation("{Season}: {Races} races, {Sprints} sprints", season, results.Count, sprints.Count);
    }

    private void AddResults(int raceId, SessionKind kind, List<JResult>? rows,
        Dictionary<string, Driver> drivers, Dictionary<string, Constructor> constructors)
    {
        foreach (var r in rows ?? [])
        {
            UpsertDriver(drivers, r.Driver);
            UpsertConstructor(constructors, r.Constructor);
            db.Results.Add(new Result
            {
                RaceId = raceId, Kind = kind, DriverId = r.Driver.DriverId, ConstructorId = r.Constructor.ConstructorId,
                Grid = int.TryParse(r.Grid, out var g) ? g : 0,
                Position = int.Parse(r.Position), PositionText = r.PositionText,
                Points = ParseDouble(r.Points), Status = r.Status,
                Laps = int.TryParse(r.Laps, out var l) ? l : 0,
            });
        }
    }

    private void UpsertDriver(Dictionary<string, Driver> cache, JDriver d)
    {
        if (cache.TryGetValue(d.DriverId, out var existing))
        {
            existing.Code ??= d.Code;
            existing.PermanentNumber ??= d.PermanentNumber;
            return;
        }
        var entity = new Driver
        {
            DriverId = d.DriverId, Code = d.Code, PermanentNumber = d.PermanentNumber, GivenName = d.GivenName,
            FamilyName = d.FamilyName, Nationality = d.Nationality, DateOfBirth = d.DateOfBirth,
        };
        cache[d.DriverId] = entity;
        db.Drivers.Add(entity);
    }

    private void UpsertConstructor(Dictionary<string, Constructor> cache, JConstructor c)
    {
        if (cache.ContainsKey(c.ConstructorId)) return;
        var entity = new Constructor { ConstructorId = c.ConstructorId, Name = c.Name, Nationality = c.Nationality };
        cache[c.ConstructorId] = entity;
        db.Constructors.Add(entity);
    }

    private void UpsertCircuit(Dictionary<string, Circuit> cache, JCircuit c)
    {
        if (cache.ContainsKey(c.CircuitId)) return;
        var entity = new Circuit
        {
            CircuitId = c.CircuitId, Name = c.CircuitName, Locality = c.Location?.Locality, Country = c.Location?.Country,
            Lat = c.Location?.Lat is { } lat ? ParseDouble(lat) : null,
            Long = c.Location?.Long is { } lng ? ParseDouble(lng) : null,
        };
        cache[c.CircuitId] = entity;
        db.Circuits.Add(entity);
    }

    private static double ParseDouble(string s) => double.Parse(s, CultureInfo.InvariantCulture);
}
