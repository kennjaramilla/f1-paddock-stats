using PaddockStats.Api.Data;

namespace PaddockStats.Api.Stats;

/// <summary>In-memory dataset the calculator works on; loaded from SQLite or built by tests.</summary>
public record Dataset(
    IReadOnlyList<Race> Races,
    IReadOnlyList<Result> Results,
    IReadOnlyList<QualifyingResult> Qualifying,
    IReadOnlyDictionary<string, Driver> Drivers,
    IReadOnlyDictionary<string, Constructor> Constructors,
    IReadOnlyDictionary<string, Circuit> Circuits,
    IReadOnlyList<OfficialStanding> Official,
    int? CurrentYear = null);

/// <summary>Pure aggregation logic; no I/O so it is unit-testable.</summary>
public static class StatsCalculator
{
    public static string FullName(Driver d) => $"{d.GivenName} {d.FamilyName}";
    public static DriverRef Ref(Driver d) => new(d.DriverId, d.Code, FullName(d));
    public static TeamRef Ref(Constructor c) => new(c.ConstructorId, c.Name);

    public static SeasonDetail Season(Dataset ds, int year)
    {
        var races = ds.Races.Where(r => r.Season == year).OrderBy(r => r.Round).ToList();
        var raceIds = races.Select(r => r.Id).ToHashSet();
        var results = ds.Results.Where(r => raceIds.Contains(r.RaceId)).ToList();
        var quali = ds.Qualifying.Where(q => raceIds.Contains(q.RaceId)).ToList();
        var roundIndex = races.Select((r, i) => (r.Id, i)).ToDictionary(x => x.Id, x => x.i);

        var summaries = races.Select(r => Summary(ds, r, results, quali)).ToList();
        var drivers = DriverStandings(ds, races, results, quali, roundIndex);
        var constructors = ConstructorStandings(ds, races, results, roundIndex, drivers);

        return new SeasonDetail(year, IsInProgress(ds, year), summaries, drivers, constructors, Reconcile(ds, year, drivers));
    }

    public static bool IsInProgress(Dataset ds, int year) =>
        ds.CurrentYear is { } current && year >= current;

    private static RaceSummary Summary(Dataset ds, Race r, List<Result> results, List<QualifyingResult> quali)
    {
        var circuit = ds.Circuits.GetValueOrDefault(r.CircuitId);
        var winner = results.FirstOrDefault(x => x.RaceId == r.Id && x.Kind == SessionKind.Race && x.Position == 1);
        var pole = PoleSitter(r.Id, results, quali);
        return new RaceSummary(r.Round, r.Name, r.CircuitId, circuit?.Name ?? r.CircuitId, circuit?.Country, r.Date, r.HasSprint,
            winner is null ? null : Ref(ds.Drivers[winner.DriverId]),
            winner is null ? null : Ref(ds.Constructors[winner.ConstructorId]),
            pole is null ? null : Ref(ds.Drivers[pole]));
    }

    /// <summary>Pole = qualifying P1; falls back to grid slot 1 when qualifying is missing.</summary>
    public static string? PoleSitter(int raceId, IEnumerable<Result> results, IEnumerable<QualifyingResult> quali) =>
        quali.FirstOrDefault(q => q.RaceId == raceId && q.Position == 1)?.DriverId
        ?? results.FirstOrDefault(x => x.RaceId == raceId && x.Kind == SessionKind.Race && x.Grid == 1)?.DriverId;

    public static List<DriverSeason> DriverStandings(Dataset ds, List<Race> races, List<Result> results,
        List<QualifyingResult> quali, Dictionary<int, int> roundIndex)
    {
        var poles = races.Select(r => PoleSitter(r.Id, results, quali)).Where(p => p is not null).GroupBy(p => p!).ToDictionary(g => g.Key, g => g.Count());

        var rows = results.GroupBy(r => r.DriverId).Select(g =>
        {
            var d = ds.Drivers[g.Key];
            var perRound = new double[races.Count];
            foreach (var r in g) perRound[roundIndex[r.RaceId]] += r.Points;
            var raceRows = g.Where(r => r.Kind == SessionKind.Race).OrderBy(r => r.RaceId).ToList();
            // Team of the latest race, plus every team driven for.
            var lastTeam = raceRows.LastOrDefault()?.ConstructorId ?? g.First().ConstructorId;
            var teams = raceRows.Select(r => r.ConstructorId).Distinct().ToList();
            return new
            {
                Driver = d,
                Team = lastTeam,
                Teams = teams,
                Cumulative = RunningTotal(perRound),
                Points = perRound.Sum(),
                Finishes = Classified(raceRows),
                Wins = raceRows.Count(r => r.Position == 1),
                Podiums = raceRows.Count(r => r.Position <= 3),
                Starts = raceRows.Count,
                Best = raceRows.Count == 0 ? (int?)null : raceRows.Min(r => r.Position),
            };
        }).ToList();

        var ordered = rows.OrderByDescending(r => r.Points).ThenBy(r => r.Finishes, FinishComparer).ToList();
        return ordered.Select((r, i) => new DriverSeason(
            r.Driver.DriverId, r.Driver.Code, FullName(r.Driver), r.Driver.Nationality,
            r.Team, ds.Constructors[r.Team].Name, r.Teams,
            i + 1, Round2(r.Points), r.Cumulative, r.Wins, r.Podiums, poles.GetValueOrDefault(r.Driver.DriverId), r.Starts, r.Best)).ToList();
    }

    private static List<ConstructorSeason> ConstructorStandings(Dataset ds, List<Race> races, List<Result> results,
        Dictionary<int, int> roundIndex, List<DriverSeason> drivers)
    {
        var rows = results.GroupBy(r => r.ConstructorId).Select(g =>
        {
            var perRound = new double[races.Count];
            foreach (var r in g) perRound[roundIndex[r.RaceId]] += r.Points;
            var raceRows = g.Where(r => r.Kind == SessionKind.Race).ToList();
            var driverOrder = drivers.Select((d, i) => (d.DriverId, i)).ToDictionary(x => x.DriverId, x => x.i);
            return new
            {
                Id = g.Key,
                Points = perRound.Sum(),
                Cumulative = RunningTotal(perRound),
                Finishes = Classified(raceRows),
                Wins = raceRows.Count(r => r.Position == 1),
                Drivers = raceRows.Select(r => r.DriverId).Distinct().OrderBy(id => driverOrder.GetValueOrDefault(id, 999)).ToList(),
            };
        }).ToList();

        var ordered = rows.OrderByDescending(r => r.Points).ThenBy(r => r.Finishes, FinishComparer).ToList();
        return ordered.Select((r, i) => new ConstructorSeason(r.Id, ds.Constructors[r.Id].Name, i + 1, Round2(r.Points), r.Cumulative, r.Wins, r.Drivers)).ToList();
    }

    private static readonly Comparer<List<int>> FinishComparer = Comparer<List<int>>.Create((a, b) => Countback(a, b));

    /// <summary>F1 tie-break: most wins, then most 2nds, and so on. Negative = a ranks higher.</summary>
    public static int Countback(IReadOnlyList<int> a, IReadOnlyList<int> b)
    {
        for (var pos = 1; pos <= 30; pos++)
        {
            var diff = b.Count(p => p == pos) - a.Count(p => p == pos);
            if (diff != 0) return diff;
        }
        return 0;
    }

    /// <summary>Only classified finishes count for tie-breaks (not R/D/W/N).</summary>
    public static List<int> Classified(IEnumerable<Result> rows) =>
        rows.Where(r => int.TryParse(r.PositionText, out _)).Select(r => r.Position).ToList();

    public static List<double> RunningTotal(IReadOnlyList<double> perRound)
    {
        var list = new List<double>(perRound.Count);
        double sum = 0;
        foreach (var p in perRound) { sum += p; list.Add(Round2(sum)); }
        return list;
    }

    public static Reconciliation Reconcile(Dataset ds, int year, List<DriverSeason> computed)
    {
        var official = ds.Official.Where(o => o.Season == year).ToList();
        if (official.Count == 0) return new Reconciliation(false, 0, 0, ["no official standings"]);
        var byId = computed.ToDictionary(c => c.DriverId);
        var mismatches = new List<string>();
        foreach (var o in official)
        {
            if (!byId.TryGetValue(o.DriverId, out var c)) { mismatches.Add($"{o.DriverId}: missing"); continue; }
            if (Math.Abs(c.Points - o.Points) > 0.01) mismatches.Add($"{o.DriverId}: points {c.Points} vs {o.Points}");
            else if (o.Position > 0 && c.Position != o.Position) mismatches.Add($"{o.DriverId}: position {c.Position} vs {o.Position}");
        }
        return new Reconciliation(mismatches.Count == 0, official.Count, official[0].Round, mismatches);
    }

    public static SeasonIndexItem SeasonIndex(SeasonDetail s)
    {
        var champ = s.Drivers.FirstOrDefault();
        var second = s.Drivers.Skip(1).FirstOrDefault();
        var cons = s.Constructors.FirstOrDefault();
        return new SeasonIndexItem(s.Year, s.Races.Count, s.InProgress,
            champ is null ? null : new DriverRef(champ.DriverId, champ.Code, champ.Name),
            champ is null ? null : new TeamRef(champ.ConstructorId, champ.ConstructorName),
            cons is null ? null : new TeamRef(cons.ConstructorId, cons.Name),
            champ is null || second is null ? 0 : Round2(champ.Points - second.Points),
            s.Drivers.Take(3).Select(d => new Contender(d.DriverId, d.Code, d.Name, d.ConstructorId, d.Points, d.Cumulative)).ToList());
    }

    public static SeasonResults SeasonResults(Dataset ds, int year)
    {
        var races = ds.Races.Where(r => r.Season == year).OrderBy(r => r.Round).ToList();
        var resultsByRace = ds.Results.Where(r => r.RaceId / 100 == year).ToLookup(r => r.RaceId);
        var qualiByRace = ds.Qualifying.Where(q => q.RaceId / 100 == year).ToLookup(q => q.RaceId);
        return new SeasonResults(year, races.Select(r => new RaceResults(r.Round, r.Name, r.CircuitId, r.Date,
            Rows(resultsByRace[r.Id].Where(x => x.Kind == SessionKind.Race)),
            Rows(resultsByRace[r.Id].Where(x => x.Kind == SessionKind.Sprint)),
            qualiByRace[r.Id].OrderBy(q => q.Position).Select(q => new QualiRow(q.DriverId, q.ConstructorId, q.Position)).ToList()
        )).ToList());

        static List<ResultRow> Rows(IEnumerable<Result> rows) => rows.OrderBy(x => x.Position)
            .Select(x => new ResultRow(x.DriverId, x.ConstructorId, x.Grid, x.Position, x.PositionText, x.Points, x.Status)).ToList();
    }

    public static List<DriverIndexItem> DriverIndex(Dataset ds, IReadOnlyList<SeasonDetail> seasons)
    {
        var raceResults = ds.Results.Where(r => r.Kind == SessionKind.Race).ToLookup(r => r.DriverId);
        var poleCounts = seasons.SelectMany(s => s.Drivers).GroupBy(d => d.DriverId).ToDictionary(g => g.Key, g => g.Sum(d => d.Poles));
        var titles = seasons.Where(s => !s.InProgress && s.Drivers.Count > 0).GroupBy(s => s.Drivers[0].DriverId).ToDictionary(g => g.Key, g => g.Count());
        var perSeason = seasons.SelectMany(s => s.Drivers.Select(d => (s.Year, d))).ToLookup(x => x.d.DriverId);

        return ds.Drivers.Values.Where(d => perSeason.Contains(d.DriverId)).Select(d =>
        {
            var rr = raceResults[d.DriverId].ToList();
            return new DriverIndexItem(d.DriverId, d.Code, d.GivenName, d.FamilyName, d.Nationality, d.PermanentNumber,
                perSeason[d.DriverId].OrderBy(x => x.Year).Select(x => new DriverSeasonTeam(x.Year, x.d.ConstructorId, x.d.ConstructorName, x.d.Position, x.d.Points, x.d.Wins)).ToList(),
                rr.Count, rr.Count(r => r.Position == 1), rr.Count(r => r.Position <= 3), poleCounts.GetValueOrDefault(d.DriverId),
                Round2(perSeason[d.DriverId].Sum(x => x.d.Points)), titles.GetValueOrDefault(d.DriverId));
        }).OrderBy(d => d.FamilyName).ThenBy(d => d.GivenName).ToList();
    }

    public static List<ConstructorIndexItem> ConstructorIndex(Dataset ds)
    {
        var seasons = ds.Results.GroupBy(r => r.ConstructorId).ToDictionary(g => g.Key, g => g.Select(r => r.RaceId / 100).Distinct().Order().ToList());
        return ds.Constructors.Values.Where(c => seasons.ContainsKey(c.ConstructorId))
            .Select(c => new ConstructorIndexItem(c.ConstructorId, c.Name, c.Nationality, seasons[c.ConstructorId]))
            .OrderBy(c => c.Name).ToList();
    }

    public static CircuitDetail? Circuit(Dataset ds, string circuitId)
    {
        if (!ds.Circuits.TryGetValue(circuitId, out var c)) return null;
        var races = ds.Races.Where(r => r.CircuitId == circuitId).OrderByDescending(r => r.Id).ToList();
        var ids = races.Select(r => r.Id).ToHashSet();
        var results = ds.Results.Where(r => ids.Contains(r.RaceId)).ToList();
        var quali = ds.Qualifying.Where(q => ids.Contains(q.RaceId)).ToList();

        var rows = races.Select(r =>
        {
            var win = results.FirstOrDefault(x => x.RaceId == r.Id && x.Kind == SessionKind.Race && x.Position == 1);
            if (win is null) return null;
            var pole = PoleSitter(r.Id, results, quali);
            return new CircuitRace(r.Season, r.Round, r.Name, Ref(ds.Drivers[win.DriverId]), Ref(ds.Constructors[win.ConstructorId]),
                win.Grid, pole is null ? null : Ref(ds.Drivers[pole]), pole == win.DriverId);
        }).OfType<CircuitRace>().ToList();

        var poleWins = rows.Count(r => r.WonFromPole);
        return new CircuitDetail(c.CircuitId, c.Name, c.Locality, c.Country, c.Lat, c.Long, rows, poleWins,
            rows.Count == 0 ? 0 : Round2((double)poleWins / rows.Count),
            rows.GroupBy(r => r.WinnerTeam.ConstructorId).Select(g => new WinCount(g.Key, g.First().WinnerTeam.Name, g.Count())).OrderByDescending(w => w.Wins).ThenBy(w => w.Name).ToList(),
            rows.GroupBy(r => r.Winner.DriverId).Select(g => new WinCount(g.Key, g.First().Winner.Name, g.Count())).OrderByDescending(w => w.Wins).ThenBy(w => w.Name).ToList());
    }

    public static List<CircuitIndexItem> CircuitIndex(Dataset ds) =>
        ds.Circuits.Keys.Select(id => Circuit(ds, id)).OfType<CircuitDetail>().Where(d => d.Races.Count > 0)
            .Select(d => new CircuitIndexItem(d.CircuitId, d.Name, d.Locality, d.Country, d.Lat, d.Long, d.Races.Count,
                d.Races.Min(r => r.Season), d.Races.Max(r => r.Season), d.Races[0].Winner, d.PoleToWinRate))
            .OrderBy(c => c.Country).ThenBy(c => c.Name).ToList();

    private static double Round2(double v) => Math.Round(v, 2);
}
