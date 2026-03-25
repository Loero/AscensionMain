using AscensionBackend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AscensionBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegisztracioController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Post(User user)
        {
            try
            {
                using (var cx = new AscensionDbContext())
                {


                    if (Program.LoggedInUsers.ContainsKey(user.Username))
                    {
                        return BadRequest("A felhasználónév már foglalt.");
                    }
                    string salt = Program.GenerateSalt();
                    string saltedHash = Program.CreateSHA256(user.PasswordHash + salt);
                    var newuser = new User
                    {
                        Username = user.Username,
                        Email = user.Email,
                        PasswordHash = saltedHash,
                        Salt = salt,
                        CreatedAt = DateTime.Now
                    };
                    await cx.Users.AddAsync(newuser);
                    await cx.SaveChangesAsync();
                    return Ok("Sikeres regisztráció.");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
