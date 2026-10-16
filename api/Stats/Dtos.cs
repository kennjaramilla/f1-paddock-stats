namespace PaddockStats.Api.Stats;

public record DriverRef(string DriverId, string? Code, string Name);
public record TeamRef(string ConstructorId, string Name);

public record Meta(string GeneratedAt, string Source, int FromSeason, int ToSeason, int Races, int Drivers, int Circuits);

public record SeasonIndexItem(int Year, int Rounds, bool InProgress, DriverRef? Champion, TeamRef? ChampionTeam, TeamRef? ConstructorsChampion, double ChampionMargin, List<Contender> Contenders);

/// <summary>Top-3 cumulative series for the title-fight sparkline.</summary>
public record Contender(string DriverId, string? Code, string Name, string ConstructorId, double Points, List<double> Cumulative);

public record SeasonDetail(
    int Year,
    bool InProgress,
    List<RaceSummary> Races,
    List<DriverSeason> Drivers,
    List<ConstructorSeason> Constructors,
    Reconciliation Reconciliation);

public record RaceSummary(int Round, string Name, string CircuitId, string CircuitName, string? Country, string? Date, bool HasSprint, DriverRef? Winner, TeamRef? WinnerTeam, DriverRef? Pole);

public record DriverSeason(
    string DriverId, string? Code, string Name, string? Nationality,
    string ConstructorId, string ConstructorName, List<string> ConstructorIds,
    int Position, double Points,
    /// <summary>Cumulative points after each round (index = round - 1).</summary>
    List<double> Cumulative,
    int Wins, int Podiums, int Poles, int Starts, int? BestFinish);

public record ConstructorSeason(string ConstructorId, string Name, int Position, double Points, List<double> Cumulative, int Wins, List<string> DriverIds);

/// <summary>Computed totals vs Jolpica's official standings.</summary>
public record Reconciliation(bool Matches, int Checked, int OfficialRound, List<string> Mismatches);

public record SeasonResults(int Year, List<RaceResults> Races);
public record RaceResults(int Round, string Name, string CircuitId, string? Date, List<ResultRow> Race, List<ResultRow> Sprint, List<QualiRow> Qualifying);
public record ResultRow(string DriverId, string ConstructorId, int Grid, int Position, string PositionText, double Points, string? Status);
public record QualiRow(string DriverId, string ConstructorId, int Position);

public record DriverIndexItem(
    string DriverId, string? Code, string GivenName, string FamilyName, string? Nationality, string? Number,
    List<DriverSeasonTeam> Seasons, int Starts, int Wins, int Podiums, int Poles, double Points, int Titles);

public record DriverSeasonTeam(int Season, string ConstructorId, string ConstructorName, int Position, double Points, int Wins);

public record ConstructorIndexItem(string ConstructorId, string Name, string? Nationality, List<int> Seasons);

public record CircuitIndexItem(string CircuitId, string Name, string? Locality, string? Country, double? Lat, double? Long,
    int Races, int FirstSeason, int LastSeason, DriverRef? LastWinner, double PoleToWinRate);

public record CircuitDetail(string CircuitId, string Name, string? Locality, string? Country, double? Lat, double? Long,
    List<CircuitRace> Races, int PoleWins, double PoleToWinRate, List<WinCount> WinsByConstructor, List<WinCount> WinsByDriver);

public record CircuitRace(int Season, int Round, string RaceName, DriverRef Winner, TeamRef WinnerTeam, int WinnerGrid, DriverRef? Pole, bool WonFromPole);

public record WinCount(string Id, string Name, int Wins);
