using AscensionBackend.Models;
using Microsoft.AspNetCore.Mvc;

namespace AscensionBackend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserProfileController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Post(Models.UserProfile userProfile)
        {
            try
            {
                using (var cx = new AscensionDbContext())
                {
                    var user = cx.Users.FirstOrDefault(u => u.Id == userProfile.UserId);
                    if (user == null)
                    {
                        return BadRequest("Hibás felhasználó ID.");
                    }
                    var existingProfile = cx.UserProfiles.FirstOrDefault(up => up.UserId == userProfile.UserId);
                    if (existingProfile != null)
                        return StatusCode(409, "A felhasználó már rendelkezik profillal.");
                    var newProfile = new UserProfile
                    {
                        UserId = userProfile.UserId,
                        Age = userProfile.Age,
                        WeightKg = userProfile.WeightKg,
                        HeightCm = userProfile.HeightCm,
                        Gender = userProfile.Gender,
                        ActivityMultiplier = userProfile.ActivityMultiplier,
                        Goal = userProfile.Goal,
                        Experience = userProfile.Experience,
                        UpdatedAt = DateTime.Now

                    };
                    await cx.UserProfiles.AddAsync(newProfile);
                    await cx.SaveChangesAsync();
                    return Ok(newProfile);


                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpDelete]
        public IActionResult Delete(int Id)
        {
            try
            {
                using (var cx = new AscensionDbContext())
                {
                    var profile = cx.UserProfiles.FirstOrDefault(up => up.UserId == Id);
                    if (profile == null)
                    {
                        return NotFound("Nincs ilyen profil.");
                    }
                    cx.UserProfiles.Remove(profile);
                    cx.SaveChanges();
                    return Ok("Profil törölve.");
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPut]
        public async Task<IActionResult> Put(int userId, int? age, double? weight, int? height, string? gender, double? activity, string? goal, string? experience, DateTime updated_at)
        {
            try
            {
                using (var cx = new AscensionDbContext())
                {
                    var Oldprofile = cx.UserProfiles.FirstOrDefault(up => up.UserId == userId);
                    if (Oldprofile == null)
                    {
                        return NotFound("Nincs ilyen profil.");
                    }
                    if (age.HasValue) Oldprofile.Age = age.Value;
                    if (weight.HasValue) Oldprofile.WeightKg = (decimal)weight.Value;
                    if (height.HasValue) Oldprofile.HeightCm = height;
                    if (!string.IsNullOrWhiteSpace(gender)) Oldprofile.Gender = gender;
                    if (activity.HasValue) Oldprofile.ActivityMultiplier = (decimal)activity.Value;
                    if (!string.IsNullOrWhiteSpace(goal)) Oldprofile.Goal = goal;
                    if (!string.IsNullOrWhiteSpace(experience)) Oldprofile.Experience = experience;
                    Oldprofile.UpdatedAt = updated_at;

                    await cx.SaveChangesAsync();
                    return Ok(Oldprofile);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet]
        public IActionResult Get()
        {
            try
            {
                using (var cx = new AscensionDbContext())
                {
                    var restult = cx.UserProfiles.ToList();
                    return Ok(restult);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                using (var cx = new AscensionDbContext())
                {
                    var profile = cx.UserProfiles.FirstOrDefault(up => up.UserId == id);
                    if (profile == null)
                    {
                        return NotFound("Nincs ilyen profil.");
                    }
                    return Ok(profile);
                }
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}