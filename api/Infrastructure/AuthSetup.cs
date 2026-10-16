using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace PaddockStats.Api.Infrastructure;

/// <summary>Policy names; roles are hierarchical, mirroring web/src/lib/auth/roles.ts.</summary>
public static class Policies
{
    public const string Analyst = "Analyst";
    public const string Admin = "Admin";
}

public static class AuthSetup
{
    /// <summary>Validates the HS256 JWT issued by the Next.js BFF (shared secret, issuer and audience).</summary>
    public static IServiceCollection AddPaddockAuth(this IServiceCollection services, IConfiguration config)
    {
        var secret = config["Auth:Secret"];
        if (string.IsNullOrEmpty(secret) || secret.Length < 32)
            throw new InvalidOperationException("Auth:Secret must be set (32+ characters).");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
        {
            o.MapInboundClaims = false;
            o.TokenValidationParameters = new TokenValidationParameters
            {
                ValidIssuer = config["Auth:Issuer"],
                ValidAudience = config["Auth:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
                RoleClaimType = "role",
                NameClaimType = "sub",
                ClockSkew = TimeSpan.FromSeconds(30),
            };
        });

        services.AddAuthorizationBuilder()
            .AddPolicy(Policies.Analyst, p => p.RequireRole("analyst", "admin"))
            .AddPolicy(Policies.Admin, p => p.RequireRole("admin"));
        return services;
    }
}
