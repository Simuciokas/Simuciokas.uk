namespace SimuciokasUK.Helpers
{
    public static class ClientIp
    {
        public static string Resolve(HttpContext http) =>
            http.Request.Headers["CF-Connecting-IP"].FirstOrDefault()
            ?? http.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";
    }
}
