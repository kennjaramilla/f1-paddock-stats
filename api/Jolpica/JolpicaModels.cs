using System.Text.Json.Serialization;

namespace PaddockStats.Api.Jolpica;

// Ergast-compatible payload; every scalar arrives as a string.
public record JolpicaEnvelope([property: JsonPropertyName("MRData")] MrData MrData);

public record MrData(string Total, string Limit, string Offset, RaceTable? RaceTable, StandingsTable? StandingsTable);

public record RaceTable(List<JRace> Races);

public record JRace(
    string Season,
    string Round,
    string RaceName,
    JCircuit Circuit,
    string? Date,
    List<JResult>? Results,
    List<JResult>? SprintResults,
    List<JQualifying>? QualifyingResults);

public record JCircuit(string CircuitId, string CircuitName, JLocation? Location);
public record JLocation(string? Lat, string? Long, string? Locality, string? Country);

public record JDriver(string DriverId, string? PermanentNumber, string? Code, string GivenName, string FamilyName, string? DateOfBirth, string? Nationality);
public record JConstructor(string ConstructorId, string Name, string? Nationality);

public record JResult(string Number, string Position, string PositionText, string Points, JDriver Driver, JConstructor Constructor, string? Grid, string? Laps, string? Status);
public record JQualifying(string Position, JDriver Driver, JConstructor Constructor);

public record StandingsTable(List<StandingsList> StandingsLists);
public record StandingsList(string Season, string Round, List<JDriverStanding> DriverStandings);
public record JDriverStanding(string Position, string Points, string Wins, JDriver Driver);
