using Dapper;
using SimuciokasUK.Models;
using System.Data;

namespace SimuciokasUK.Repositories
{
    public class SuggestionRepository(IDbConnection _connection)
    {
        public void Insert(Suggestion suggestion)
        {
            _connection.Execute(
                "INSERT INTO Suggestions (IPAddress, Type, Notes, Created) VALUES (@IPAddress, @Type, @Note, @Created)",
                suggestion
            );
        }

        public int GetLastHourCount(string ip, string type)
        {
            return _connection.Query(
                "SELECT ID FROM Suggestions WHERE IPAddress = @Ip AND Created >= @Date AND Type = @Type ORDER BY Created",
                new { Ip = ip, Date = DateTime.UtcNow.AddHours(-1).ToString("yyyy-MM-dd HH:mm:ss"), Type = type }).Count();
        }
    }
}
