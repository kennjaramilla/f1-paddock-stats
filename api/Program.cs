using Amazon.Lambda.AspNetCoreServer.Hosting;
using Microsoft.AspNetCore.HttpLogging;
using PaddockStats.Api.Data;
using PaddockStats.Api.Endpoints;
using PaddockStats.Api.Export;
using PaddockStats.Api.Infrastructure;
using PaddockStats.Api.Ingestion;
using PaddockStats.Api.Jolpica;
using PaddockStats.Api.Stats;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Structured JSON logs (CloudWatch-friendly); scopes carry the correlation id.
builder.Logging.ClearProviders().AddJsonConsole(o => o.IncludeScopes = true);
builder.Services.AddHttpLogging(o =>
{
    // Method, path, status and duration only: no headers or bodies, so no tokens or PII in logs.
    o.LoggingFields = HttpLoggingFields.RequestMethod | HttpLoggingFields.RequestPath | HttpLoggingFields.ResponseStatusCode | HttpLoggingFields.Duration;
    o.CombineLogs = true;
});

// Runs as a normal Kestrel app locally; on AWS Lambda behind API Gateway HTTP API when deployed with SAM.
builder.Services.AddAWSLambdaHosting(LambdaEventSource.HttpApi);

builder.Services.AddPaddockDatabase(builder.Configuration, builder.Environment);
builder.Services.AddMemoryCache();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddScoped<StatsService>();
builder.Services.AddScoped<IngestionService>();
builder.Services.AddScoped<SnapshotExporter>();
builder.Services.AddJolpicaClient(builder.Configuration);

builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks().AddDbContextCheck<PaddockDbContext>();
builder.Services.AddApiRateLimiting();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .WithOrigins(builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [])
    .WithMethods("GET", "POST", "DELETE")
    .WithHeaders("Authorization", "Content-Type", CorrelationIdMiddleware.Header)
    .WithExposedHeaders(CorrelationIdMiddleware.Header)));

var app = builder.Build();

// CLI: `ingest [from] [to]` pulls from Jolpica into SQLite; `export [dir]` writes the static snapshot.
if (args is ["ingest", ..] or ["export", ..])
{
    await CliCommands.RunAsync(app.Services, args);
    return;
}

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseHttpLogging();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseCors();
app.UseRateLimiter();

app.MapOpenApi();
app.MapScalarApiReference();
app.MapGet("/", () => Results.Redirect("/scalar/v1")).ExcludeFromDescription();
app.MapHealthChecks("/health");
app.MapPaddockApi();
if (app.Environment.IsDevelopment()) app.MapAdminApi(); // until role-based auth protects it

app.Run();

public partial class Program;
