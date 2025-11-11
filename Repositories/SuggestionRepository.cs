using Dapper;
using SimuciokasUK.Models;
using System.Data;

namespace SimuciokasUK.Repositories
{
    public class SuggestionRepository(IDbConnection _connection)
    {
        public void Insert(Suggestion suggestion)
        {
            var paths = suggestion.AttachmentPaths != null
                ? string.Join(',', suggestion.AttachmentPaths)
                : null;

            _connection.Execute(
                "INSERT INTO Suggestions (IPAddress, Type, Notes, Created, AttachmentPaths) VALUES (@IPAddress, @Type, @Note, @Created, @AttachmentPaths)",
                new
                {
                    suggestion.IPAddress,
                    suggestion.Type,
                    Note = suggestion.Note,
                    suggestion.Created,
                    AttachmentPaths = paths
                }
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
