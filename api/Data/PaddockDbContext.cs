using Microsoft.EntityFrameworkCore;

namespace PaddockStats.Api.Data;

public class PaddockDbContext(DbContextOptions<PaddockDbContext> options) : DbContext(options)
{
    public DbSet<Driver> Drivers => Set<Driver>();
    public DbSet<Constructor> Constructors => Set<Constructor>();
    public DbSet<Circuit> Circuits => Set<Circuit>();
    public DbSet<Race> Races => Set<Race>();
    public DbSet<Result> Results => Set<Result>();
    public DbSet<QualifyingResult> Qualifying => Set<QualifyingResult>();
    public DbSet<OfficialStanding> OfficialStandings => Set<OfficialStanding>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Driver>().HasKey(d => d.DriverId);
        b.Entity<Constructor>().HasKey(c => c.ConstructorId);
        b.Entity<Circuit>().HasKey(c => c.CircuitId);
        b.Entity<Race>().Property(r => r.Id).ValueGeneratedNever();
        b.Entity<Race>().HasIndex(r => new { r.Season, r.Round }).IsUnique();
        b.Entity<Race>().HasIndex(r => r.CircuitId);
        b.Entity<Result>().HasIndex(r => new { r.RaceId, r.Kind });
        b.Entity<Result>().HasIndex(r => r.DriverId);
        b.Entity<QualifyingResult>().HasIndex(q => q.RaceId);
        b.Entity<OfficialStanding>().HasIndex(s => s.Season);
    }
}
