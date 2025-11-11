namespace SimuciokasUK.Models
{
    public class Suggestion
    {
        public int ID { get; set; }
        public string Type { get; set; }
        public string Note { get; set; }
        public string IPAddress { get; set; }
        public DateTime Created { get; set; }

        // Optional list of uploaded files
        public List<string>? AttachmentPaths { get; set; }
        public List<IFormFile>? Attachments { get; set; }
    }
}
