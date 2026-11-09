using PaddockStats.Api.Stats;

namespace PaddockStats.Api.Csv;

/// <summary>The CSV twins of the chart tables. Shared by the endpoints and the snapshot export so both match.</summary>
public static class CsvExports
{
    public record CsvFile(string Csv, string FileName);

    public static CsvFile Drivers(int year, SeasonDetail season) => new(CsvTable.Write(
        ["Position", "Driver", "Code", "Nationality", "Team", "Points", "Wins", "Podiums", "Poles", "Starts", "Best finish"],
        season.Drivers.OrderBy(d => d.Position).Select(d => (IReadOnlyList<object?>)
            [d.Position, d.Name, d.Code, d.Nationality, d.ConstructorName, d.Points, d.Wins, d.Podiums, d.Poles, d.Starts, d.BestFinish])),
        $"f1-{year}-drivers.csv");

    public static CsvFile Constructors(int year, SeasonDetail season) => new(CsvTable.Write(
        ["Position", "Team", "Points", "Wins"],
        season.Constructors.OrderBy(c => c.Position).Select(c => (IReadOnlyList<object?>)
            [c.Position, c.Name, c.Points, c.Wins])),
        $"f1-{year}-constructors.csv");

    public static CsvFile CircuitRaces(CircuitDetail circuit) => new(CsvTable.Write(
        ["Season", "Round", "Race", "Winner", "Team", "Grid", "Pole", "Won from pole"],
        circuit.Races.OrderByDescending(r => r.Season).Select(r => (IReadOnlyList<object?>)
            [r.Season, r.Round, r.RaceName, r.Winner.Name, r.WinnerTeam.Name, r.WinnerGrid, r.Pole?.Name, r.WonFromPole])),
        $"f1-{circuit.CircuitId}-winners.csv");
}
