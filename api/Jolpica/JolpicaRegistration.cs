namespace PaddockStats.Api.Jolpica;

public static class JolpicaRegistration
{
    public static IServiceCollection AddJolpicaClient(this IServiceCollection services, IConfiguration config)
    {
        var http = services.AddHttpClient<JolpicaClient>(c =>
        {
            c.BaseAddress = new Uri(config["Jolpica:BaseUrl"] ?? "https://api.jolpi.ca/ergast/f1/");
            c.DefaultRequestHeaders.UserAgent.ParseAdd("f1-paddock-stats/1.0");
        });
        // Resilience is registered first so it wraps the throttle: retries are spaced out too.
        http.AddStandardResilienceHandler(o =>
        {
            // Retries 429/5xx with backoff and honours Retry-After.
            o.Retry.MaxRetryAttempts = 6;
            o.Retry.Delay = TimeSpan.FromSeconds(2);
            o.AttemptTimeout.Timeout = TimeSpan.FromSeconds(60);
            o.CircuitBreaker.SamplingDuration = TimeSpan.FromMinutes(3);
            o.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(5);
        });
        http.AddHttpMessageHandler(() => new ThrottlingHandler(TimeSpan.FromMilliseconds(350)));
        return services;
    }
}
