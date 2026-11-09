using System.Net;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using PaddockStats.Api.Csv;
using PaddockStats.Api.Export;

namespace PaddockStats.Tests;

public class CsvTableTests
{
    [Theory]
    [InlineData("Monza", "Monza")]
    [InlineData("Sainz, Jr.", "\"Sainz, Jr.\"")]
    [InlineData("The \"Prof\"", "\"The \"\"Prof\"\"\"")]
    [InlineData("=HYPERLINK(\"x\")", "\"'=HYPERLINK(\"\"x\"\")\"")]
    [InlineData("-1", "'-1")]
    [InlineData("@SUM(A1)", "'@SUM(A1)")]
    public void Escapes_text_and_neutralises_formulas(string value, string expected) =>
        Assert.Equal(expected, CsvTable.Field(value));

    [Fact]
    public void Writes_numbers_invariantly_and_leaves_negative_numbers_numeric()
    {
        Assert.Equal("395.5", CsvTable.Field(395.5));
        Assert.Equal("-3", CsvTable.Field(-3));
        Assert.Equal("", CsvTable.Field(null));
        Assert.Equal("yes", CsvTable.Field(true));
        Assert.Equal("A,B\r\n1,\"x,y\"\r\n", CsvTable.Write(["A", "B"], [[1, "x,y"]]));
    }
}

public class CsvEndpointTests(AuthorizationTests.ApiFactory factory) : IClassFixture<AuthorizationTests.ApiFactory>
{
    private readonly HttpClient _client = factory.CreateClient();

    private async Task<(HttpResponseMessage Response, string[] Lines)> Csv(string url)
    {
        var response = await _client.GetAsync(url);
        var text = response.IsSuccessStatusCode ? Encoding.UTF8.GetString(await response.Content.ReadAsByteArrayAsync()) : "";
        return (response, text.TrimStart('﻿').Split("\r\n", StringSplitOptions.RemoveEmptyEntries));
    }

    [Fact]
    public async Task Drivers_standings_download_as_csv_with_a_file_name()
    {
        var (response, lines) = await Csv("/api/seasons/2021/drivers.csv");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/csv", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal("f1-2021-drivers.csv", response.Content.Headers.ContentDisposition?.FileNameStar);
        Assert.Equal("Position,Driver,Code,Nationality,Team,Points,Wins,Podiums,Poles,Starts,Best finish", lines[0]);
        Assert.StartsWith("1,Max Verstappen,VER,", lines[1]);
        Assert.Contains(",395.5,", lines[1]);
        Assert.StartsWith("2,Lewis Hamilton,", lines[2]);
    }

    [Fact]
    public async Task Constructors_and_circuit_winners_download_as_csv()
    {
        var (_, teams) = await Csv("/api/seasons/2021/constructors.csv");
        Assert.Equal("Position,Team,Points,Wins", teams[0]);
        Assert.StartsWith("1,Mercedes,", teams[1]);

        var (_, monza) = await Csv("/api/circuits/monza/races.csv");
        Assert.Equal("Season,Round,Race,Winner,Team,Grid,Pole,Won from pole", monza[0]);
        Assert.Equal(14, monza.Length);
        Assert.StartsWith("2026,", monza[1]);
    }

    [Theory]
    [InlineData("/api/seasons/1900/drivers.csv")]
    [InlineData("/api/seasons/1900/constructors.csv")]
    [InlineData("/api/circuits/nowhere/races.csv")]
    public async Task Unknown_seasons_and_circuits_are_404(string url) =>
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync(url)).StatusCode);

    [Fact]
    public async Task The_snapshot_export_writes_the_same_csv_files_as_the_api()
    {
        var dir = Path.Combine(Path.GetTempPath(), $"paddock-export-{Guid.NewGuid():N}");
        try
        {
            using (var scope = factory.Services.CreateScope())
                await scope.ServiceProvider.GetRequiredService<SnapshotExporter>().ExportAsync(dir, CancellationToken.None);

            foreach (var route in new[] { "seasons/2021/drivers.csv", "seasons/2021/constructors.csv", "circuits/monza/races.csv" })
            {
                var fromApi = await _client.GetByteArrayAsync($"/api/{route}");
                Assert.Equal(fromApi, await File.ReadAllBytesAsync(Path.Combine(dir, route)));
            }
        }
        finally
        {
            if (Directory.Exists(dir)) Directory.Delete(dir, recursive: true);
        }
    }
}
