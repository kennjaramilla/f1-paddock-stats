using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace PaddockStats.Tests;

public class AuthorizationTests : IClassFixture<AuthorizationTests.ApiFactory>
{
    private const string Secret = "test-secret-0123456789abcdef0123456789";
    private readonly HttpClient _client;

    public AuthorizationTests(ApiFactory factory) => _client = factory.CreateClient();

    public class ApiFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
        {
            builder.UseSetting("Auth:Secret", Secret);
            builder.UseSetting("Database:Path", Path.Combine(Path.GetTempPath(), $"paddock-test-{Guid.NewGuid():N}.db"));
        }
    }

    private static string Token(string role, string issuer = "paddock-stats") => new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
    {
        Subject = new ClaimsIdentity([new Claim("sub", $"u-{role}"), new Claim("role", role)]),
        Issuer = issuer,
        Audience = "paddock-api",
        Expires = DateTime.UtcNow.AddMinutes(5),
        SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Secret)), SecurityAlgorithms.HmacSha256),
    });

    private async Task<HttpStatusCode> GetAsync(string url, string? token)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (token is not null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return (await _client.SendAsync(request)).StatusCode;
    }

    [Fact]
    public async Task Public_stats_need_no_token() =>
        Assert.Equal(HttpStatusCode.OK, await GetAsync("/api/seasons/2021", null));

    [Theory]
    [InlineData(null, HttpStatusCode.Unauthorized)]
    [InlineData("viewer", HttpStatusCode.Forbidden)]
    [InlineData("analyst", HttpStatusCode.OK)]
    [InlineData("admin", HttpStatusCode.OK)]
    public async Task Race_results_require_analyst(string? role, HttpStatusCode expected) =>
        Assert.Equal(expected, await GetAsync("/api/seasons/2021/results", role is null ? null : Token(role)));

    [Fact]
    public async Task Tokens_from_another_issuer_are_rejected() =>
        Assert.Equal(HttpStatusCode.Unauthorized, await GetAsync("/api/seasons/2021/results", Token("admin", issuer: "someone-else")));

    [Fact]
    public async Task Admin_endpoints_reject_analysts()
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/admin/seasons/2021/refresh");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", Token("analyst"));
        Assert.Equal(HttpStatusCode.Forbidden, (await _client.SendAsync(request)).StatusCode);
    }
}
