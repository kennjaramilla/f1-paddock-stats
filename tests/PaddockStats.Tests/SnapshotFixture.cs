using System.Text.Json;
using PaddockStats.Api.Data;
using PaddockStats.Api.Stats;

namespace PaddockStats.Tests;

/// <summary>Rebuilds a calculator Dataset from the committed snapshot so tests run offline.</summary>
public static class SnapshotFixture
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public static string DataDir
    {
        get
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            while (dir is not null && !Directory.Exists(Path.Combine(dir.FullName, "web", "public", "data"))) dir = dir.Parent;
            return Path.Combine(dir?.FullName ?? throw new DirectoryNotFoundException("snapshot not found"), "web", "public", "data");
        }
    }

    private static T Read<T>(string route) => JsonSerializer.Deserialize<T>(File.ReadAllText(Path.Combine(DataDir, route + ".json")), Json)!;

    public static Dataset Load(params int[] years)
    {
        var races = new List<Race>();
        var results = new List<Result>();
        var quali = new List<QualifyingResult>();
        foreach (var year in years)
        {
            var season = Read<SeasonResults>($"seasons/{year}/results");
            foreach (var r in season.Races)
            {
                var id = year * 100 + r.Round;
                races.Add(new Race { Id = id, Season = year, Round = r.Round, Name = r.Name, CircuitId = r.CircuitId, Date = r.Date, HasSprint = r.Sprint.Count > 0 });
                results.AddRange(r.Race.Select(x => ToResult(id, SessionKind.Race, x)));
                results.AddRange(r.Sprint.Select(x => ToResult(id, SessionKind.Sprint, x)));
                quali.AddRange(r.Qualifying.Select(q => new QualifyingResult { RaceId = id, DriverId = q.DriverId, ConstructorId = q.ConstructorId, Position = q.Position }));
            }
        }
        var drivers = Read<List<DriverIndexItem>>("drivers").ToDictionary(d => d.DriverId,
            d => new Driver { DriverId = d.DriverId, Code = d.Code, GivenName = d.GivenName, FamilyName = d.FamilyName });
        var constructors = Read<List<ConstructorIndexItem>>("constructors").ToDictionary(c => c.ConstructorId,
            c => new Constructor { ConstructorId = c.ConstructorId, Name = c.Name });
        var circuits = races.Select(r => r.CircuitId).Distinct().ToDictionary(id => id, id => new Circuit { CircuitId = id, Name = id });
        return new Dataset(races, results, quali, drivers, constructors, circuits, []);
    }

    private static Result ToResult(int raceId, SessionKind kind, ResultRow x) => new()
    {
        RaceId = raceId, Kind = kind, DriverId = x.DriverId, ConstructorId = x.ConstructorId, Grid = x.Grid,
        Position = x.Position, PositionText = x.PositionText, Points = x.Points, Status = x.Status,
    };
}
