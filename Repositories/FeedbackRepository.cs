using System.Data;
using Dapper;
using Microsoft.Data.Sqlite;
using SimuciokasUK.Models;

namespace SimuciokasUK.Repositories
{
    public class FeedbackRepository(IConfiguration _configuration)
    {
        private readonly string _connectionString = _configuration.GetConnectionString("DefaultConnection") ?? "Data Source=app.db";

        private IDbConnection Connection => new SqliteConnection(_connectionString);

        public void Insert(Feedback feedback)
        {
            Connection.Execute(
                "INSERT INTO Feedback (IPAddress, Rating, Notes, Created) VALUES (@IPAddress, @Rating, @Notes, @Created)",
                feedback
            );
        }

        public Feedback? Get(string ip)
        {
            return Connection.QueryFirstOrDefault<Feedback>(
                "SELECT * FROM Feedback WHERE IpAddress = @Ip ORDER BY Created DESC LIMIT 1",
                new { Ip = ip }
            );
        }
    }

}
