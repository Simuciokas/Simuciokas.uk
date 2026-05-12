using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace SimuciokasUK.Helpers
{
    public interface ITurnstileVerifier
    {
        Task<bool> VerifyAsync(string? token, string? clientIp, CancellationToken cancellationToken = default);
    }

    /// <summary>Used when Turnstile is disabled in config — always passes.</summary>
    public sealed class NoOpTurnstileVerifier : ITurnstileVerifier
    {
        public Task<bool> VerifyAsync(string? token, string? clientIp, CancellationToken cancellationToken = default)
            => Task.FromResult(true);
    }

    public sealed class TurnstileVerifier : ITurnstileVerifier
    {
        private readonly HttpClient _http;
        private readonly IOptionsMonitor<TurnstileOptions> _options;
        private readonly ILogger<TurnstileVerifier> _logger;

        public TurnstileVerifier(
            HttpClient http,
            IOptionsMonitor<TurnstileOptions> options,
            ILogger<TurnstileVerifier> logger)
        {
            _http = http;
            _options = options;
            _logger = logger;
        }

        public async Task<bool> VerifyAsync(string? token, string? clientIp, CancellationToken cancellationToken = default)
        {
            var opts = _options.CurrentValue;
            if (!opts.Enabled || string.IsNullOrWhiteSpace(opts.SecretKey))
                return true;

            if (string.IsNullOrWhiteSpace(token))
                return false;

            var form = new Dictionary<string, string>
            {
                ["secret"] = opts.SecretKey,
                ["response"] = token,
            };
            if (!string.IsNullOrWhiteSpace(clientIp))
                form["remoteip"] = clientIp;

            try
            {
                using var content = new FormUrlEncodedContent(form);
                using var response = await _http.PostAsync(opts.VerifyUrl, content, cancellationToken);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Turnstile verify returned HTTP {Status}", (int)response.StatusCode);
                    return false;
                }

                var body = await response.Content.ReadFromJsonAsync<SiteVerifyResponse>(cancellationToken: cancellationToken);
                if (body == null) return false;

                if (!body.Success)
                    _logger.LogInformation("Turnstile token rejected: {Errors}", string.Join(',', body.ErrorCodes ?? Array.Empty<string>()));

                return body.Success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Turnstile verification call failed");
                return false;
            }
        }

        private sealed class SiteVerifyResponse
        {
            [JsonPropertyName("success")] public bool Success { get; set; }
            [JsonPropertyName("error-codes")] public string[]? ErrorCodes { get; set; }
        }
    }
}
