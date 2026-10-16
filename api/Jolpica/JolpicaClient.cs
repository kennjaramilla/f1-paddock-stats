using System.Net.Http.Json;
using System.Text.Json;

namespace PaddockStats.Api.Jolpica;

public class JolpicaClient(HttpClient http, ILogger<JolpicaClient> logger)
{
    private const int PageSize = 100;
    private static readonly JsonSerializerOptions Json = new() { PropertyNameCaseInsensitive = true };

    public Task<List<JRace>> GetResultsAsync(int season, CancellationToken ct) => GetRacesPagedAsync($"{season}/results/", ct);
    public Task<List<JRace>> GetSprintAsync(int season, CancellationToken ct) => GetRacesPagedAsync($"{season}/sprint/", ct);
    public Task<List<JRace>> GetQualifyingAsync(int season, CancellationToken ct) => GetRacesPagedAsync($"{season}/qualifying/", ct);
    public Task<List<JRace>> GetScheduleAsync(int season, CancellationToken ct) => GetRacesPagedAsync($"{season}/races/", ct);

    public async Task<StandingsList?> GetDriverStandingsAsync(int season, CancellationToken ct)
    {
        var env = await GetAsync($"{season}/driverstandings/?limit={PageSize}", ct);
        return env.MrData.StandingsTable?.StandingsLists.FirstOrDefault();
    }

    /// <summary>Pages through a race table; a race can be split across pages, so rows are merged by round.</summary>
    private async Task<List<JRace>> GetRacesPagedAsync(string path, CancellationToken ct)
    {
        var byRound = new Dictionary<string, JRace>();
        var offset = 0;
        int total;
        do
        {
            var env = await GetAsync($"{path}?limit={PageSize}&offset={offset}", ct);
            total = int.Parse(env.MrData.Total);
            foreach (var race in env.MrData.RaceTable?.Races ?? [])
            {
                byRound[race.Round] = byRound.TryGetValue(race.Round, out var existing)
                    ? existing with
                    {
                        Results = Concat(existing.Results, race.Results),
                        SprintResults = Concat(existing.SprintResults, race.SprintResults),
                        QualifyingResults = Concat(existing.QualifyingResults, race.QualifyingResults),
                    }
                    : race;
            }
            offset += PageSize;
        } while (offset < total);

        return byRound.Values.OrderBy(r => int.Parse(r.Round)).ToList();
    }

    private static List<T>? Concat<T>(List<T>? a, List<T>? b) => a is null ? b : b is null ? a : [.. a, .. b];

    private async Task<JolpicaEnvelope> GetAsync(string relative, CancellationToken ct)
    {
        logger.LogInformation("GET {Path}", relative);
        var env = await http.GetFromJsonAsync<JolpicaEnvelope>(relative, Json, ct);
        return env ?? throw new InvalidOperationException($"Empty response for {relative}");
    }
}

/// <summary>Keeps us under Jolpica's burst limit by spacing requests.</summary>
public class ThrottlingHandler(TimeSpan minInterval) : DelegatingHandler
{
    private readonly SemaphoreSlim _gate = new(1, 1);
    private DateTime _last = DateTime.MinValue;

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
    {
        await _gate.WaitAsync(ct);
        try
        {
            var wait = _last + minInterval - DateTime.UtcNow;
            if (wait > TimeSpan.Zero) await Task.Delay(wait, ct);
            _last = DateTime.UtcNow;
        }
        finally { _gate.Release(); }
        return await base.SendAsync(request, ct);
    }
}
