using System.Threading.RateLimiting;

namespace PaddockStats.Api.Infrastructure;

public static class RateLimits
{
    public const string Api = "api";

    /// <summary>Fixed window per client IP; generous for a read-only API, but stops scraping loops.</summary>
    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services) =>
        services.AddRateLimiter(o =>
        {
            o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            o.AddPolicy(Api, ctx => RateLimitPartition.GetFixedWindowLimiter(
                ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions { PermitLimit = 300, Window = TimeSpan.FromMinutes(1) }));
        });
}
