namespace SimuciokasUK.Models
{
    public class Suggestion
    {
        public int ID { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Note { get; set; } = string.Empty;
        public string IPAddress { get; set; } = string.Empty;
        public DateTime Created { get; set; }

        public List<string>? AttachmentPaths { get; set; }
        public List<IFormFile>? Attachments { get; set; }
    }
}
