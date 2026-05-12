# Persistence (SQLite + Dapper)

Read this before adding a column, changing a query, or registering anything DB-related in DI.

## Stack

- **SQLite** via `Microsoft.Data.Sqlite`.
- **Dapper** for query mapping. There is no EF Core.
- DB file: `app.db` in the content root. Path comes from `ConnectionStrings:DefaultConnection` (fallback `Data Source=app.db` hardcoded in `Program.cs`).
- Models: `Models/Suggestion.cs`, `Models/Feedback.cs` — POCOs with property names matching column names.
- Repositories: `Repositories/SuggestionRepository.cs`, `FeedbackRepository.cs` — thin Dapper wrappers.

## DI lifetimes (don't break this)

`IDbConnection` and both repositories are registered **scoped**. One connection per request, disposed at end of scope.

**Do not register them as singletons.** Microsoft.Data.Sqlite connections are not safe to share across concurrent requests. The default registration in `Program.cs`:

```csharp
builder.Services.AddScoped<IDbConnection>(sp =>
    new SqliteConnection(builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=app.db"));
builder.Services.AddScoped<FeedbackRepository>();
builder.Services.AddScoped<SuggestionRepository>();
```

## Schema migrations

All migrations live in `Helpers/SchemaMigrator.cs` as `(int Version, string Sql)` tuples. To add a column or table:

1. Append a new entry to the migrations array with the next version number.
2. If the migration's effect could already be present on a legacy DB (e.g. you're adding something that was hand-applied in prod), also update `BackfillFromExistingSchema` so the runner knows to mark it as applied without re-running.

A `SchemaVersion` table tracks applied versions. Each migration runs in its own transaction. The runner opens the connection if it isn't already open.

On first boot against a pre-existing DB (e.g. prod), `BackfillFromExistingSchema` inspects `sqlite_master` / `pragma table_info` and inserts rows for migrations whose effects are already present — so the runner is idempotent against legacy databases.

## Hot queries

- Every suggestion submit: `SELECT COUNT(*) FROM Suggestions WHERE IPAddress=? AND Created>=? AND Type=?`
- Every page load: `SELECT * FROM Feedback WHERE IPAddress=? ORDER BY Created DESC LIMIT 1` (from `/api/feedback/needed`)

Both run unindexed today. Add an `IX_Suggestions_IP_Type_Created` and `IX_Feedback_IP_Created` migration if either becomes a problem.

## Test DBs

`TestApplicationFactory` (in `tests/SimuciokasUK.Tests/`) uses a temp-file SQLite per test class. The Playwright fixture sweeps stale `simuciokas-{e2e,tests}-*.db` files older than 1h from `%TEMP%` on init.
