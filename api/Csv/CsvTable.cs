using System.Globalization;
using System.Text;

namespace PaddockStats.Api.Csv;

/// <summary>RFC 4180 CSV: comma separated, CRLF rows, fields quoted when they contain a comma, quote or newline.</summary>
public static class CsvTable
{
    public static string Write(IReadOnlyList<string> header, IEnumerable<IReadOnlyList<object?>> rows)
    {
        var csv = new StringBuilder();
        AppendRow(csv, header);
        foreach (var row in rows) AppendRow(csv, row);
        return csv.ToString();
    }

    private static void AppendRow(StringBuilder csv, IEnumerable<object?> cells)
    {
        csv.AppendJoin(',', cells.Select(Field));
        csv.Append("\r\n");
    }

    public static string Field(object? value)
    {
        var text = value switch
        {
            null => "",
            bool b => b ? "yes" : "no",
            IFormattable f => f.ToString(null, CultureInfo.InvariantCulture),
            _ => value.ToString() ?? "",
        };
        // Spreadsheets run cells starting with = + - @ as formulas; a leading quote keeps them text.
        // Numbers are exempt so negative values stay numeric.
        if (value is string && text.Length > 0 && "=+-@\t\r".Contains(text[0])) text = "'" + text;
        return text.IndexOfAny([',', '"', '\r', '\n']) >= 0 ? $"\"{text.Replace("\"", "\"\"")}\"" : text;
    }

    /// <summary>UTF-8 with a BOM, so Excel reads accented names correctly.</summary>
    public static byte[] Bytes(string csv) => Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();

    public static IResult File(string csv, string fileName) => Results.File(Bytes(csv), "text/csv; charset=utf-8", fileName);
}
