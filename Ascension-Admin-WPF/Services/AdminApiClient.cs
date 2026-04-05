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

    var raw = await response.Content.ReadAsStringAsync();
    var data = JsonSerializer.Deserialize<AdminLoginResponse>(raw, JsonOptions);

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
    var raw = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize<AdminOverviewResponse>(raw, JsonOptions);
  }

  public async Task<AdminUsersResponse?> GetUsersAsync(int limit = 200)
  {
    EnsureAuthorized();

    using var response = await _httpClient.GetAsync($"api/admin/users?limit={limit}");
    var raw = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize<AdminUsersResponse>(raw, JsonOptions);
  }

  public async Task<ApiMessageResponse?> DeleteUserAsync(int userId)
  {
    EnsureAuthorized();

    using var response = await _httpClient.DeleteAsync($"api/admin/users/{userId}");
    var raw = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize<ApiMessageResponse>(raw, JsonOptions);
  }

  private void EnsureAuthorized()
  {
    if (string.IsNullOrWhiteSpace(Token))
    {
      throw new InvalidOperationException("Admin token nem elérhető. Jelentkezz be.");
    }
  }
}
