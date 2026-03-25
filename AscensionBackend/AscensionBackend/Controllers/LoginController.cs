using AscensionBackend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AscensionBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Post(DTOs.LoginDTO loginDTO)
        {
            try
            {
                using (var cx = new AscensionDbContext())
                {
                    var user = cx.Users.FirstOrDefault(u => u.Username == loginDTO.Credentials || u.Email == loginDTO.Credentials);
                    if (user == null)
                    {
                        return BadRequest("Hibás felhasználónév vagy email.");
                    }
                    string saltedHash = Program.CreateSHA256(loginDTO.Password + user.Salt);
                    if (saltedHash != user.PasswordHash)
                    {
                        return BadRequest("Hibás jelszó.");
                    }
                    string token = Guid.NewGuid().ToString();
                    Program.LoggedInUsers[token] = user;
                    return Ok(token);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
