namespace SimuciokasUK.Helpers
{
    public static class SuggestionTypes
    {
        public static readonly string[] Allowed =
            { "Map", "Cypher", "Anagram", "Puzzle", "Light", "Beacon", "Chest", "HotCold", "GE", "Other" };

        public static bool TryNormalize(string input, out string normalized)
        {
            var match = Allowed.FirstOrDefault(t =>
                t.Equals(input, StringComparison.InvariantCultureIgnoreCase));
            normalized = match ?? string.Empty;
            return match != null;
        }
    }
}
