using PaddockStats.Api.Data;
using PaddockStats.Api.Stats;

namespace PaddockStats.Tests;

public class StatsCalculatorTests
{
    [Theory]
    // Official final driver standings (Jolpica driverStandings), top 3.
    [InlineData(2016, "rosberg", 385, "hamilton", 380, "ricciardo", 256)]
    [InlineData(2021, "max_verstappen", 395.5, "hamilton", 387.5, "bottas", 226)]
    [InlineData(2025, "norris", 423, "max_verstappen", 421, "piastri", 410)]
    public void Computed_standings_match_official_season_totals(int year, string p1, double pts1, string p2, double pts2, string p3, double pts3)
    {
        var season = StatsCalculator.Season(SnapshotFixture.Load(year), year);

        var top = season.Drivers.Take(3).Select(d => (d.DriverId, d.Points)).ToList();
        Assert.Equal([(p1, pts1), (p2, pts2), (p3, pts3)], top);
        Assert.Equal(season.Races.Count, season.Drivers[0].Cumulative.Count);
        Assert.Equal(pts1, season.Drivers[0].Cumulative[^1]);
    }

    [Fact]
    public void Sprint_points_are_added_in_the_round_they_were_scored()
    {
        var season = StatsCalculator.Season(SnapshotFixture.Load(2021), 2021);
        var ver = season.Drivers.Single(d => d.DriverId == "max_verstappen");
        var british = season.Races.Single(r => r.Name.StartsWith("British"));
        var idx = british.Round - 1;
        // Verstappen won the 2021 British sprint (3) and retired from the race (0).
        Assert.Equal(3, ver.Cumulative[idx] - ver.Cumulative[idx - 1]);
    }

    [Fact]
    public void Countback_breaks_ties_on_best_finishes()
    {
        Assert.True(StatsCalculator.Countback([1, 5], [2, 2]) < 0);
        Assert.True(StatsCalculator.Countback([3, 3], [3, 4]) < 0);
        Assert.Equal(0, StatsCalculator.Countback([2], [2]));
    }

    [Fact]
    public void Only_classified_finishes_count_for_countback()
    {
        var rows = new[]
        {
            new Result { DriverId = "a", ConstructorId = "x", Position = 14, PositionText = "14" },
            new Result { DriverId = "a", ConstructorId = "x", Position = 18, PositionText = "R" },
        };
        Assert.Equal([14], StatsCalculator.Classified(rows));
    }

    [Fact]
    public void Running_total_accumulates_and_rounds()
    {
        Assert.Equal([12.5, 37.5, 37.5], StatsCalculator.RunningTotal([12.5, 25, 0]));
    }

    [Fact]
    public void Pole_falls_back_to_grid_when_qualifying_is_missing()
    {
        var results = new[] { new Result { RaceId = 1, Kind = SessionKind.Race, DriverId = "a", ConstructorId = "x", Grid = 1, Position = 2, PositionText = "2" } };
        Assert.Equal("a", StatsCalculator.PoleSitter(1, results, []));
        Assert.Equal("b", StatsCalculator.PoleSitter(1, results, [new QualifyingResult { RaceId = 1, DriverId = "b", ConstructorId = "y", Position = 1 }]));
    }

    [Fact]
    public void Reconciliation_reports_points_mismatches()
    {
        var ds = SnapshotFixture.Load(2021) with { Official = [new OfficialStanding { Season = 2021, Round = 22, DriverId = "hamilton", Position = 2, Points = 400 }] };
        var season = StatsCalculator.Season(ds, 2021);
        Assert.False(season.Reconciliation.Matches);
        Assert.Contains(season.Reconciliation.Mismatches, m => m.StartsWith("hamilton: points"));
    }

    [Fact]
    public void Circuit_detail_counts_pole_conversions()
    {
        var ds = SnapshotFixture.Load(2023, 2024);
        var monaco = StatsCalculator.Circuit(ds, "monaco")!;
        Assert.Equal(2, monaco.Races.Count);
        Assert.Equal(monaco.Races.Count(r => r.WonFromPole), monaco.PoleWins);
        Assert.Equal(2024, monaco.Races[0].Season);
    }
}
