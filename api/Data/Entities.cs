namespace PaddockStats.Api.Data;

public class Driver
{
    public required string DriverId { get; set; }
    public string? Code { get; set; }
    public string? PermanentNumber { get; set; }
    public required string GivenName { get; set; }
    public required string FamilyName { get; set; }
    public string? Nationality { get; set; }
    public string? DateOfBirth { get; set; }
}

public class Constructor
{
    public required string ConstructorId { get; set; }
    public required string Name { get; set; }
    public string? Nationality { get; set; }
}

public class Circuit
{
    public required string CircuitId { get; set; }
    public required string Name { get; set; }
    public string? Locality { get; set; }
    public string? Country { get; set; }
    public double? Lat { get; set; }
    public double? Long { get; set; }
}

public class Race
{
    /// <summary>Season * 100 + round.</summary>
    public int Id { get; set; }
    public int Season { get; set; }
    public int Round { get; set; }
    public required string Name { get; set; }
    public required string CircuitId { get; set; }
    public string? Date { get; set; }
    public bool HasSprint { get; set; }
}

public enum SessionKind { Race = 0, Sprint = 1 }

public class Result
{
    public int Id { get; set; }
    public int RaceId { get; set; }
    public SessionKind Kind { get; set; }
    public required string DriverId { get; set; }
    public required string ConstructorId { get; set; }
    public int Grid { get; set; }
    public int Position { get; set; }
    public required string PositionText { get; set; }
    public double Points { get; set; }
    public string? Status { get; set; }
    public int Laps { get; set; }
}

public class QualifyingResult
{
    public int Id { get; set; }
    public int RaceId { get; set; }
    public required string DriverId { get; set; }
    public required string ConstructorId { get; set; }
    public int Position { get; set; }
}

/// <summary>Official season-end (or latest) driver standings, kept to reconcile computed totals.</summary>
public class OfficialStanding
{
    public int Id { get; set; }
    public int Season { get; set; }
    public int Round { get; set; }
    public required string DriverId { get; set; }
    public int Position { get; set; }
    public double Points { get; set; }
    public int Wins { get; set; }
}
