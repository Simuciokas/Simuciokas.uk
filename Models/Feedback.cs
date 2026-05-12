namespace SimuciokasUK.Models
{
    public class Feedback
    {
        public int Id { get; set; }
        public string IPAddress { get; set; } = string.Empty;
        public int Rating { get; set; }
        public string Notes { get; set; } = string.Empty;
        public DateTime Created { get; set; }
    }
}
