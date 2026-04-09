using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Ascension.Admin.Wpf.Models;

namespace Ascension.Admin.Wpf.Services;

public sealed class AdminApiClient
{
  private readonly HttpClient _httpClient;
  private static readonly JsonSerializerOptions JsonOptions = new()
  {
    PropertyNameCaseInsensitive = true,
  };

  public string? Token { get; private set; }

  public AdminApiClient(string baseUrl)
  {
    _httpClient = new HttpClient
    {
      BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/"),
    };
  }

  public async Task<AdminLoginResponse?> LoginAsync(string username, string password)
  {
    var body = JsonSerializer.Serialize(new { username, password });
    using var content = new StringContent(body, Encoding.UTF8, "application/json");
    using var response = await _httpClient.PostAsync("api/admin/login", content);

    var data = await ReadJsonOrErrorAsync<AdminLoginResponse>(response);

    if (response.IsSuccessStatusCode && data?.Success == true && !string.IsNullOrWhiteSpace(data.Token))
    {
      Token = data.Token;
      _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Token);
    }

    return data;
  }

  public async Task<AdminOverviewResponse?> GetOverviewAsync()
  {
    EnsureAuthorized();

    using var response = await _httpClient.GetAsync("api/admin/overview");
    return await ReadJsonOrErrorAsync<AdminOverviewResponse>(response);
  }

  public async Task<AdminUsersResponse?> GetUsersAsync(int limit = 200)
  {
    EnsureAuthorized();

    using var response = await _httpClient.GetAsync($"api/admin/users?limit={limit}");
    return await ReadJsonOrErrorAsync<AdminUsersResponse>(response);
  }

  public async Task<ApiMessageResponse?> DeleteUserAsync(int userId)
  {
    EnsureAuthorized();

    using var response = await _httpClient.DeleteAsync($"api/admin/users/{userId}");
    return await ReadJsonOrErrorAsync<ApiMessageResponse>(response);
  }

  private async Task<T?> ReadJsonOrErrorAsync<T>(HttpResponseMessage response) where T : class, new()
  {
    var raw = await response.Content.ReadAsStringAsync();

    try
    {
      var parsed = JsonSerializer.Deserialize<T>(raw, JsonOptions);
      if (parsed is not null)
      {
        return parsed;
      }
    }
    catch
    {
      // Fallback below gives user-friendly error in UI instead of JSON parser exception.
    }

    var message = $"API hiba ({(int)response.StatusCode}): {response.ReasonPhrase}";
    if (!string.IsNullOrWhiteSpace(raw))
    {
      message += $" | Valasz: {raw.Trim()}";
    }

    if (typeof(T) == typeof(AdminLoginResponse))
    {
      return new AdminLoginResponse
      {
        Success = false,
        Error = message,
      } as T;
    }

    if (typeof(T) == typeof(AdminOverviewResponse))
    {
      return new AdminOverviewResponse
      {
        Success = false,
        Error = message,
      } as T;
    }

    if (typeof(T) == typeof(AdminUsersResponse))
    {
      return new AdminUsersResponse
      {
        Success = false,
        Error = message,
      } as T;
    }

    if (typeof(T) == typeof(ApiMessageResponse))
    {
      return new ApiMessageResponse
      {
        Success = false,
        Error = message,
      } as T;
    }

    throw new InvalidOperationException(message);
  }

  private void EnsureAuthorized()
  {
    if (string.IsNullOrWhiteSpace(Token))
    {
      throw new InvalidOperationException("Admin token nem elérhető. Jelentkezz be.");
    }
  }
}
