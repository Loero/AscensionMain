using System.Collections.ObjectModel;
using System.Linq;
using System.Reflection;
using System.Windows;
using System.Windows.Controls;
using Ascension.Admin.Wpf.Models;
using Ascension.Admin.Wpf.Services;

namespace Ascension.Admin.Wpf;

public partial class MainWindow : Window
{
  private AdminApiClient? _apiClient;
  private readonly ObservableCollection<AdminUserDto> _users = new();

  private TextBox BaseUrlTextBoxControl => (TextBox)FindRequiredControl("BaseUrlTextBox");
  private TextBox UsernameTextBoxControl => (TextBox)FindRequiredControl("UsernameTextBox");
  private PasswordBox PasswordBoxControl => (PasswordBox)FindRequiredControl("PasswordBox");
  private TextBlock LoginStateTextBlockControl => (TextBlock)FindRequiredControl("LoginStateTextBlock");
  private Button RefreshButtonControl => (Button)FindRequiredControl("RefreshButton");
  private Button DeleteButtonControl => (Button)FindRequiredControl("DeleteButton");
  private TextBlock MessageTextBlockControl => (TextBlock)FindRequiredControl("MessageTextBlock");
  private TextBlock UsersCountTextControl => (TextBlock)FindRequiredControl("UsersCountText");
  private TextBlock FoodEntriesCountTextControl => (TextBlock)FindRequiredControl("FoodEntriesCountText");
  private TextBlock WorkoutEntriesCountTextControl => (TextBlock)FindRequiredControl("WorkoutEntriesCountText");
  private TextBlock SkinRoutinesCountTextControl => (TextBlock)FindRequiredControl("SkinRoutinesCountText");
  private TextBlock FoodCaloriesTextControl => (TextBlock)FindRequiredControl("FoodCaloriesText");
  private TextBlock BurnedCaloriesTextControl => (TextBlock)FindRequiredControl("BurnedCaloriesText");
  private DataGrid UsersGridControl => (DataGrid)FindRequiredControl("UsersGrid");

  public MainWindow()
  {
    // Invoke generated InitializeComponent when available, without hard symbol binding.
    var initMethod = GetType().GetMethod(
      "InitializeComponent",
      BindingFlags.Instance | BindingFlags.Public | BindingFlags.NonPublic);

    initMethod?.Invoke(this, null);

    UsersGridControl.ItemsSource = _users;
  }

  private async void LoginButton_Click(object sender, RoutedEventArgs e)
  {
    try
    {
      MessageTextBlockControl.Text = "Bejelentkezes folyamatban...";

      _apiClient = new AdminApiClient(BaseUrlTextBoxControl.Text.Trim());
      var login = await _apiClient.LoginAsync(
        UsernameTextBoxControl.Text.Trim(),
        PasswordBoxControl.Password.Trim());

      if (login?.Success != true || string.IsNullOrWhiteSpace(login.Token))
      {
        LoginStateTextBlockControl.Text = "Sikertelen login";
        MessageTextBlockControl.Text = login?.Error ?? "Ismeretlen login hiba.";
        return;
      }

      LoginStateTextBlockControl.Text = "Sikeres admin login";
      RefreshButtonControl.IsEnabled = true;
      await LoadDashboardAsync();
    }
    catch (Exception ex)
    {
      MessageTextBlockControl.Text = "Hiba: " + ex.Message;
    }
  }

  private async void RefreshButton_Click(object sender, RoutedEventArgs e)
  {
    await LoadDashboardAsync();
  }

  private async Task LoadDashboardAsync()
  {
    if (_apiClient is null)
    {
      return;
    }

    try
    {
      MessageTextBlockControl.Text = "Adatok frissitese...";

      var overview = await _apiClient.GetOverviewAsync();
      if (overview?.Success == true && overview.Overview is not null)
      {
        UsersCountTextControl.Text = overview.Overview.UsersCount.ToString();
        FoodEntriesCountTextControl.Text = overview.Overview.FoodEntriesCount.ToString();
        WorkoutEntriesCountTextControl.Text = overview.Overview.WorkoutEntriesCount.ToString();
        SkinRoutinesCountTextControl.Text = overview.Overview.SkinRoutinesCount.ToString();
        FoodCaloriesTextControl.Text = Math.Round(overview.Overview.TotalFoodCalories).ToString();
        BurnedCaloriesTextControl.Text = Math.Round(overview.Overview.TotalBurnedCalories).ToString();
      }

      var users = await _apiClient.GetUsersAsync();
      _users.Clear();

      foreach (var user in users?.Users ?? Enumerable.Empty<AdminUserDto>())
      {
        _users.Add(user);
      }

      MessageTextBlockControl.Text = $"Frissitve: {_users.Count} user.";
    }
    catch (Exception ex)
    {
      MessageTextBlockControl.Text = "Hiba frissites kozben: " + ex.Message;
    }
  }

  private async void DeleteButton_Click(object sender, RoutedEventArgs e)
  {
    if (_apiClient is null || UsersGridControl.SelectedItem is not AdminUserDto selected)
    {
      return;
    }

    var result = MessageBox.Show(
      $"Biztos torlod ezt a felhasznalot?\n\nId: {selected.Id}\nUsername: {selected.Username}",
      "Megerosites",
      MessageBoxButton.YesNo,
      MessageBoxImage.Warning);

    if (result != MessageBoxResult.Yes)
    {
      return;
    }

    try
    {
      var response = await _apiClient.DeleteUserAsync(selected.Id);

      if (response?.Success == true)
      {
        MessageTextBlockControl.Text = response.Message ?? "User torolve.";
        await LoadDashboardAsync();
      }
      else
      {
        MessageTextBlockControl.Text = response?.Error ?? "Torles sikertelen.";
      }
    }
    catch (Exception ex)
    {
      MessageTextBlockControl.Text = "Hiba torles kozben: " + ex.Message;
    }
  }

  private void UsersGrid_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
  {
    DeleteButtonControl.IsEnabled = UsersGridControl.SelectedItem is AdminUserDto;
  }

  private object FindRequiredControl(string name)
  {
    return FindName(name)
      ?? throw new InvalidOperationException($"A(z) '{name}' nevu WPF control nem talalhato.");
  }
}
