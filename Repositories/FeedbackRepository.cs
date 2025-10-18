using System.Data;
using Dapper;
using SimuciokasUK.Models;

namespace SimuciokasUK.Repositories
{
    public class FeedbackRepository(IDbConnection _connection)
    {
        public void Insert(Feedback feedback)
        {
            _connection.Execute(
                "INSERT INTO Feedback (IPAddress, Rating, Notes, Created) VALUES (@IPAddress, @Rating, @Notes, @Created)",
                feedback
            );
        }
        public Feedback? Get(string ip)
        {
            return _connection.QueryFirstOrDefault<Feedback>(
                "SELECT * FROM Feedback WHERE IpAddress = @Ip ORDER BY Created DESC LIMIT 1",
                new { Ip = ip }
            );
        }
    }

}
