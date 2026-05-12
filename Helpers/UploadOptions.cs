namespace SimuciokasUK.Helpers
{
    public sealed class UploadOptions
    {
        public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;
        public long MaxTotalSizeBytes { get; set; } = 25 * 1024 * 1024;
        public int MaxFilesPerRequest { get; set; } = 5;
        public string[] AllowedExtensions { get; set; } =
            new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    }
}
