using Dapper;
using System.Data;

namespace SimuciokasUK.Helpers
{
    public static class SchemaMigrator
    {
        private static readonly (int Version, string Sql)[] Migrations =
        {
            (1, @"
                CREATE TABLE IF NOT EXISTS Feedback (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    IPAddress TEXT,
                    Rating INTEGER NOT NULL,
                    Notes TEXT,
                    Created TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS Suggestions (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    IPAddress TEXT,
                    Type TEXT,
                    Notes TEXT,
                    Created TEXT NOT NULL
                );
            "),
            (2, "ALTER TABLE Suggestions ADD COLUMN AttachmentPaths TEXT;"),
        };

        public static void Run(IDbConnection connection)
        {
            if (connection.State != ConnectionState.Open)
                connection.Open();

            var schemaVersionExisted = connection.QueryFirstOrDefault<string>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='SchemaVersion';") != null;

            connection.Execute(@"
                CREATE TABLE IF NOT EXISTS SchemaVersion (
                    Version INTEGER PRIMARY KEY,
                    Applied TEXT NOT NULL
                );");

            if (!schemaVersionExisted)
                BackfillFromExistingSchema(connection);

            var applied = connection
                .Query<int>("SELECT Version FROM SchemaVersion;")
                .ToHashSet();

            foreach (var (version, sql) in Migrations.OrderBy(m => m.Version))
            {
                if (applied.Contains(version)) continue;

                using var tx = connection.BeginTransaction();
                connection.Execute(sql, transaction: tx);
                connection.Execute(
                    "INSERT INTO SchemaVersion (Version, Applied) VALUES (@Version, @Applied);",
                    new { Version = version, Applied = DateTime.UtcNow.ToString("O") },
                    transaction: tx);
                tx.Commit();
            }
        }

        private static void BackfillFromExistingSchema(IDbConnection connection)
        {
            var now = DateTime.UtcNow.ToString("O");

            var hasFeedback = connection.QueryFirstOrDefault<string>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='Feedback';") != null;
            var hasSuggestions = connection.QueryFirstOrDefault<string>(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='Suggestions';") != null;

            if (hasFeedback && hasSuggestions)
                connection.Execute(
                    "INSERT INTO SchemaVersion (Version, Applied) VALUES (1, @Applied);",
                    new { Applied = now });

            if (hasSuggestions)
            {
                var hasAttachmentPaths = connection
                    .Query("PRAGMA table_info(Suggestions);")
                    .Any(row => string.Equals((string)row.name, "AttachmentPaths", StringComparison.OrdinalIgnoreCase));

                if (hasAttachmentPaths)
                    connection.Execute(
                        "INSERT INTO SchemaVersion (Version, Applied) VALUES (2, @Applied);",
                        new { Applied = now });
            }
        }
    }
}
