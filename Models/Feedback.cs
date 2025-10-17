namespace SimuciokasUK.Models
{
    public class Feedback
    {
        public int Id { get; set; }
        public string IPAddress { get; set; }
        public int Rating { get; set; }
        public string Notes { get; set; }
        public DateTime Created { get; set; }
    }

}
