// Bejelentkezés/Regisztráció modal kezelése
const API_URL = "http://localhost:3000/api/auth";

document.addEventListener("DOMContentLoaded", function () {
  const authModal = document.getElementById("auth-modal");
  const authToggle = document.getElementById("auth-toggle");
  const authClose = document.querySelector(".auth-close");
  const authTabs = document.querySelectorAll(".auth-tab");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const ctaJoinButtons = document.querySelectorAll(".cta-join");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.querySelector(".profile-close");
  const profileContent = document.getElementById("profile-content");
  const logoutBtn = document.getElementById("logout-btn");

  function getStoredUser() {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn("Hibás user adat localStorage-ben:", e);
      return null;
    }
  }

  // Ellenőrizzük van-e bejelentkezett felhasználó
  checkAuthStatus();

  // "Csatlakozz a rendszerhez" → csak modal megnyitása (nincs azonnali redirect)
  if (ctaJoinButtons && ctaJoinButtons.length) {
    ctaJoinButtons.forEach((ctaJoin) =>
      ctaJoin.addEventListener("click", function (e) {
        e.preventDefault();

        const user = getStoredUser();
        if (user) {
          // Ha már be van jelentkezve, ne nyissa meg a modalt, hanem dobja a dashboardra
          window.location.href = "./dashboard.html";
          return;
        }

        if (authModal) {
          // Open modal
          authModal.classList.add("active");
          document.body.style.overflow = "hidden";

          // Ha ez a CTA azt jelenti, hogy "csatlakozz", akkor alapból a regisztrációs tab legyen aktív
          if (authTabs && authTabs.length) {
            authTabs.forEach((t) => t.classList.remove("active"));
            const regTab = Array.from(authTabs).find(
              (t) => t.getAttribute("data-tab") === "register",
            );
            const loginTab = Array.from(authTabs).find(
              (t) => t.getAttribute("data-tab") === "login",
            );
            if (regTab) regTab.classList.add("active");
            if (loginTab) loginTab.classList.remove("active");
          }

          if (registerForm && loginForm) {
            registerForm.classList.add("active");
            loginForm.classList.remove("active");
          }

          // Fókusz az első regisztrációs inputra
          const regFirst =
            document.getElementById("register-username") ||
            document.getElementById("register-email");
          if (regFirst) regFirst.focus();
        }
      }),
    );
  }

  // Modal megnyitása (auth toggle) - csak ha van ilyen gomb az oldalon
  if (authToggle) {
    authToggle.addEventListener("click", function (e) {
      e.preventDefault();
      const user = getStoredUser();
      if (user) {
        // Ha be van jelentkezve, profil modal megnyitása
        if (typeof openProfileModal === "function") openProfileModal();
      } else {
        // Ha nincs bejelentkezve, modal megnyitása
        if (authModal) {
          authModal.classList.add("active");
          document.body.style.overflow = "hidden";
        } else {
          // Olyan oldalakon, ahol nincs auth modal, vigyük a főoldalra belépéshez
          window.location.href = "../main.html";
        }
      }
    });
  }

  // Modal bezárása - csak ha van bezáró gomb
  if (authClose) {
    authClose.addEventListener("click", function () {
      if (authModal) {
        authModal.classList.remove("active");
        document.body.style.overflow = "auto";
      }
    });
  }

  // Modal bezárása kattintásra a háttéren
  if (authModal) {
    authModal.addEventListener("click", function (e) {
      if (e.target === authModal) {
        authModal.classList.remove("active");
        document.body.style.overflow = "auto";
      }
    });
  }

  // Modal bezárása ESC billentyűre
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      authModal &&
      authModal.classList.contains("active")
    ) {
      authModal.classList.remove("active");
      document.body.style.overflow = "auto";
    }
  });

  // Tab váltás - csak ha vannak tabok és formok
  if (authTabs && authTabs.length && loginForm && registerForm) {
    authTabs.forEach((tab) => {
      // Ensure tab buttons do not act as submit buttons
      if (tab.tagName === "BUTTON") tab.setAttribute("type", "button");

      tab.addEventListener("click", function (e) {
        // Prevent default to avoid scrolling to top if button would submit
        if (e && typeof e.preventDefault === "function") e.preventDefault();

        const tabName = this.getAttribute("data-tab");

        authTabs.forEach((t) => t.classList.remove("active"));
        this.classList.add("active");

        if (tabName === "login") {
          loginForm.classList.add("active");
          registerForm.classList.remove("active");
        } else {
          registerForm.classList.add("active");
          loginForm.classList.remove("active");
        }
      });
    });
  }

  // Bejelentkezési form submit - csak ha létezik a form
  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const emailOrUsernameEl = document.getElementById("login-email");
      const passwordEl = document.getElementById("login-password");
      const emailOrUsername = emailOrUsernameEl ? emailOrUsernameEl.value : "";
      const password = passwordEl ? passwordEl.value : "";

      try {
        console.log("🔐 Bejelentkezés indítása...");
        console.log("🌐 API URL:", `${API_URL}/login`);
        console.log("📤 Küldött adatok:", { emailOrUsername, password });

        const response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailOrUsername, password }),
        });

        console.log("📨 Válasz státusz:", response.status);
        console.log("📨 Válasz headers:", response.headers);

        const data = await response.json();

        console.log("Válasz:", data);

        if (data.success) {
          localStorage.setItem("authToken", data.token);

          // Profil lekérése, hogy megkapjuk a createdAt mezőt is
          let userToStore = data.user;
          try {
            const profileRes = await fetch(
              "http://localhost:3000/api/profile",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${data.token}`,
                  "Content-Type": "application/json",
                },
              },
            );
            const profileData = await profileRes.json();
            if (
              profileData.success &&
              profileData.profile &&
              profileData.profile.user
            ) {
              userToStore = profileData.profile.user;
            }
          } catch (profileError) {
            console.error(
              "❌ Profil lekérés login után nem sikerült:",
              profileError,
            );
          }

          localStorage.setItem("user", JSON.stringify(userToStore));

          alert(`✅ Sikeres bejelentkezés! Üdv, ${data.user.username}! 🎉`);

          loginForm.reset();
          if (authModal) authModal.classList.remove("active");
          document.body.style.overflow = "auto";

          updateAuthButton();

          // Redirect to dashboard after successful login
          window.location.href = "./dashboard.html";
        } else {
          alert(`❌ ${data.error}`);
        }
      } catch (error) {
        console.error("❌ Login hiba:", error);
        alert(
          "❌ Nem lehet kapcsolódni a backend-hez!\n\nEllenőrizd:\n- Backend fut? (npm start)\n- Port 3000 szabad?\n- MySQL elindul?",
        );
      }
    });
  }

  // Regisztrációs form submit
  if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const username = document.getElementById("register-username").value;
      const email = document.getElementById("register-email").value;
      const password = document.getElementById("register-password").value;
      const passwordConfirm = document.getElementById(
        "register-password-confirm",
      ).value;

      if (password !== passwordConfirm) {
        alert("❌ A jelszavak nem egyeznek!");
        return;
      }

      console.log("📝 Regisztráció indítása...", { username, email });

      try {
        const response = await fetch(`${API_URL}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();

        console.log("Válasz:", data);

        if (data.success) {
          localStorage.setItem("authToken", data.token);

          // Profil lekérése, hogy megkapjuk a createdAt mezőt is
          let userToStore = data.user;
          try {
            const profileRes = await fetch(
              "http://localhost:3000/api/profile",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${data.token}`,
                  "Content-Type": "application/json",
                },
              },
            );
            const profileData = await profileRes.json();
            if (
              profileData.success &&
              profileData.profile &&
              profileData.profile.user
            ) {
              userToStore = profileData.profile.user;
            }
          } catch (profileError) {
            console.error(
              "❌ Profil lekérés regisztráció után nem sikerült:",
              profileError,
            );
          }

          localStorage.setItem("user", JSON.stringify(userToStore));

          alert(`✅ Sikeres regisztráció! Üdv, ${data.user.username}! 🎉`);

          registerForm.reset();
          if (authModal) authModal.classList.remove("active");
          document.body.style.overflow = "auto";

          updateAuthButton();

          // Redirect to dashboard after successful registration
          window.location.href = "./dashboard.html";
        } else {
          alert(`❌ ${data.error}`);
        }
      } catch (error) {
        console.error("❌ Register hiba:", error);
        alert(
          "❌ Nem lehet kapcsolódni a backend-hez!\n\nEllenőrizd:\n- Backend fut? (npm start)\n- Port 3000 szabad?\n- MySQL elindult?",
        );
      }
    });
  }

  // Auth státusz ellenőrzése
  function checkAuthStatus() {
    const token = localStorage.getItem("authToken");
    // Mindig hívjuk meg az updateAuthButton-t, hogy a navbar láthatósága helyesen beálluljon
    updateAuthButton();
  }

  // Auth gomb frissítése
  function updateAuthButton() {
    const user = getStoredUser();

    if (!authToggle) return; // Safely return if element missing on this page

    if (user) {
      // Bejelentkezett felhasználó: felhasználónév a jobb felső sarokban
      authToggle.textContent = user.username || "Fiókod";
      authToggle.title = user.username
        ? `Fiókod (${user.username})`
        : "Profil megtekintése";
    } else {
      // Nincs bejelentkezve: alapértelmezett szöveg
      authToggle.textContent = "Bejelentkezés";
      authToggle.title = "Bejelentkezés / Regisztráció";
    }
  }

  // ========== PROFIL MODAL FUNKCIÓK ==========

  let profileDayWatcherIntervalId = null;
  let profileLastDateKey = "";

  function getTodayDateKeyForProfile() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function stopProfileDayWatcher() {
    if (profileDayWatcherIntervalId) {
      clearInterval(profileDayWatcherIntervalId);
      profileDayWatcherIntervalId = null;
    }
  }

  function startProfileDayWatcher() {
    stopProfileDayWatcher();
    profileLastDateKey = getTodayDateKeyForProfile();
    profileDayWatcherIntervalId = setInterval(() => {
      if (!profileModal || !profileModal.classList.contains("active")) return;
      const currentDateKey = getTodayDateKeyForProfile();
      if (currentDateKey === profileLastDateKey) return;
      profileLastDateKey = currentDateKey;
      fetchProfileData();
    }, 30000);
  }

  // Profil modal megnyitása
  async function openProfileModal() {
    console.log("📊 Profil modal megnyitása...");

    profileModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Betöltés jelző megjelenítése
    profileContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #bdbdbd;">
                <p>⏳ Profil adatok betöltése...</p>
            </div>
        `;
    startProfileDayWatcher();
    // Profil adatok lekérése
    await fetchProfileData();
  }

  // Tegyük elérhetővé más scriptek számára is (pl. dashboard)
  window.openProfileModal = openProfileModal;

  // Profil adatok lekérése a backend-től
  async function fetchProfileData() {
    try {
      const token = localStorage.getItem("authToken");

      if (!token) {
        profileContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #ff6a6a;">
                        <p>❌ Nincs bejelentkezve!</p>
                    </div>
                `;
        return;
      }

      console.log("🔄 Profil lekérés a backend-től...");

      const response = await fetch("http://localhost:3000/api/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      console.log("✅ Profil válasz:", data);

      if (!data.success) {
        profileContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #ff6a6a;">
                        <p>❌ ${data.error || "Profil betöltése sikertelen"}</p>
                    </div>
                `;
        return;
      }

      // Napi kalória + mai étel bejegyzések lekérése az adott napra
      const now = new Date();
      const pad = (n) => String(n).padStart(2, "0");
      const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      let dailyCalories = 0;
      let dailyFoodEntries = [];
      let dailyProtein = 0;
      let dailyCarbs = 0;
      let dailyWorkoutMinutes = 0;
      let dailyWorkoutEntries = 0;
      let dailyWorkoutSets = 0;
      let dailyWorkoutPlanLabel = "";
      let totalWorkoutEntriesComputed = null;
      let totalWorkoutSetsComputed = null;
      let skinRoutineData = null;
      let requiredSkinSteps = 0;
      let completedSkinSteps = 0;
      let skinIntensity = 0;

      try {
        // Bőrápolási rutin lekérése
        try {
          const skinResp = await fetch(
            "http://localhost:3000/api/skin/routine",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          const skinData = await skinResp.json();
          if (skinData.success && skinData.routine) {
            skinRoutineData = skinData.routine;
            console.log("✅ Bőrápolási rutin lekérve:", skinData.routine);

            const stripSkinStepLabel = (value) =>
              String(value || "")
                .replace(/[^a-zA-Z0-9\s.,:()\-+/%áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, "")
                .replace(/\s+/g, " ")
                .trim();

            const requiredSteps = [
              ...(Array.isArray(skinData.routine.morning_routine)
                ? skinData.routine.morning_routine
                    .map((step) => stripSkinStepLabel(step))
                    .filter(Boolean)
                    .slice(0, 3)
                : []),
              ...(Array.isArray(skinData.routine.evening_routine)
                ? skinData.routine.evening_routine
                    .map((step) => stripSkinStepLabel(step))
                    .filter(Boolean)
                    .slice(0, 3)
                : []),
            ];

            requiredSkinSteps = requiredSteps.length;

            try {
              const skinTrackingResp = await fetch(
                `http://localhost:3000/api/skin/tracking?routine_id=${encodeURIComponent(skinData.routine.id)}&date=${encodeURIComponent(todayStr)}`,
                {
                  method: "GET",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                },
              );

              const skinTrackingData = await skinTrackingResp.json();
              if (skinTrackingData.success && skinTrackingData.tracking) {
                const completedLabels = [
                  ...(Array.isArray(skinTrackingData.tracking.morning_steps)
                    ? skinTrackingData.tracking.morning_steps
                    : []),
                  ...(Array.isArray(skinTrackingData.tracking.evening_steps)
                    ? skinTrackingData.tracking.evening_steps
                    : []),
                ].map((step) => stripSkinStepLabel(step));

                completedSkinSteps = requiredSteps.filter((step) =>
                  completedLabels.includes(step),
                ).length;
              }
            } catch (skinTrackErr) {
              console.warn(
                "Skin tracking backend lekérési hiba:",
                skinTrackErr,
              );
            }

            if (completedSkinSteps === 0 && requiredSkinSteps > 0) {
              try {
                const localTrackingRaw = localStorage.getItem(
                  "ascension_skin_tracking_v1",
                );
                if (localTrackingRaw) {
                  const localTrackingMap = JSON.parse(localTrackingRaw);
                  const localToday = localTrackingMap?.[todayStr];
                  if (
                    localToday &&
                    Number.isFinite(Number(localToday.completedCount))
                  ) {
                    completedSkinSteps = Math.max(
                      0,
                      Math.min(
                        requiredSkinSteps,
                        Number(localToday.completedCount),
                      ),
                    );
                  }
                }
              } catch (localSkinErr) {
                console.warn(
                  "Skin tracking local fallback hiba:",
                  localSkinErr,
                );
              }
            }

            skinIntensity =
              requiredSkinSteps > 0
                ? Math.min(
                    100,
                    Math.round((completedSkinSteps / requiredSkinSteps) * 100),
                  )
                : 0;
          }
        } catch (skinErr) {
          console.error("❌ Bőrápolási rutin lekérési hiba:", skinErr);
        }

        const foodResp = await fetch(
          `http://localhost:3000/api/food/entries?date=${todayStr}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const foodData = await foodResp.json();
        if (foodData.success && Array.isArray(foodData.entries)) {
          dailyCalories = foodData.entries.reduce(
            (sum, entry) => sum + (entry.calories || 0),
            0,
          );
          dailyProtein = foodData.entries.reduce(
            (sum, entry) => sum + Number(entry.protein_g || 0),
            0,
          );
          dailyCarbs = foodData.entries.reduce(
            (sum, entry) => sum + Number(entry.carbs_g || 0),
            0,
          );

          // Alakítsuk a mai bejegyzéseket ugyanarra a formára, mint a profil recentEntries
          dailyFoodEntries = foodData.entries.map((entry) => ({
            id: entry.id,
            foodName: entry.food_name,
            grams: entry.grams,
            calories: entry.calories,
            proteinG:
              typeof entry.protein_g === "number"
                ? entry.protein_g.toFixed(1)
                : entry.protein_g,
            carbsG:
              typeof entry.carbs_g === "number"
                ? entry.carbs_g.toFixed(1)
                : entry.carbs_g,
            date: entry.date,
            createdAt: entry.created_at,
          }));
        }

        // Mai edzés percek lekérése
        try {
          const workoutResp = await fetch(
            `http://localhost:3000/api/workout?startDate=${todayStr}&endDate=${todayStr}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const workoutData = await workoutResp.json();
          if (workoutData.success && Array.isArray(workoutData.entries)) {
            const normalizeDayToken = (value) =>
              String(value || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s*[-]\s*.*/, "")
                .replace(/[()]/g, "")
                .trim();

            const doesPlanDayMatchToday = (planDayLabel, todayName) => {
              if (!planDayLabel || !todayName) return false;
              const normalized = normalizeDayToken(planDayLabel);
              const todayNormalized = normalizeDayToken(todayName);
              return normalized
                .split("/")
                .map((part) => part.trim())
                .some((part) => part === todayNormalized);
            };

            const ACTIVE_WORKOUT_DAY_KEY = "ascension_active_workout_day_v1";
            const ACTIVE_WORKOUT_DAY_DATE_KEY =
              "ascension_active_workout_day_date_v1";
            const selectedPlanDay = localStorage.getItem(
              ACTIVE_WORKOUT_DAY_KEY,
            );
            const selectedPlanDayDate = localStorage.getItem(
              ACTIVE_WORKOUT_DAY_DATE_KEY,
            );
            const hasTodayOverride = selectedPlanDayDate === todayStr;

            let effectivePlanDay = "";
            try {
              const savedPlanRaw = localStorage.getItem(
                "ascension_training_plan_v1",
              );
              if (savedPlanRaw) {
                const savedPlan = JSON.parse(savedPlanRaw);
                const structure = savedPlan?.planStructure || {};
                if (
                  hasTodayOverride &&
                  selectedPlanDay &&
                  structure[selectedPlanDay]
                ) {
                  effectivePlanDay = selectedPlanDay;
                } else {
                  const todayName = new Date().toLocaleDateString("hu-HU", {
                    weekday: "long",
                  });
                  effectivePlanDay =
                    Object.keys(structure).find((dayLabel) =>
                      doesPlanDayMatchToday(dayLabel, todayName),
                    ) || "";
                }
              }
            } catch (dayResolveErr) {
              console.warn("Edzésnap feloldási hiba:", dayResolveErr);
            }

            dailyWorkoutPlanLabel = effectivePlanDay;

            const filteredWorkoutEntries = effectivePlanDay
              ? workoutData.entries.filter(
                  (entry) =>
                    String(entry.workoutType || "") === effectivePlanDay,
                )
              : workoutData.entries;

            dailyWorkoutEntries = filteredWorkoutEntries.length;
            dailyWorkoutSets = filteredWorkoutEntries.reduce(
              (sum, entry) => sum + Number(entry.sets || 0),
              0,
            );
            dailyWorkoutMinutes = filteredWorkoutEntries.reduce(
              (sum, entry) => sum + Number(entry.durationMinutes || 0),
              0,
            );
          }

          // Összes edzés bejegyzés külön lekérése a teljes szett számhoz
          const allWorkoutResp = await fetch(
            "http://localhost:3000/api/workout",
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          const allWorkoutData = await allWorkoutResp.json();
          if (allWorkoutData.success && Array.isArray(allWorkoutData.entries)) {
            totalWorkoutEntriesComputed = allWorkoutData.entries.length;
            totalWorkoutSetsComputed = allWorkoutData.entries.reduce(
              (sum, entry) => sum + Number(entry.sets || 0),
              0,
            );
          }
        } catch (woErr) {
          console.error("❌ Napi edzés lekérési hiba:", woErr);
        }
      } catch (foodErr) {
        console.error("❌ Napi kalória lekérési hiba:", foodErr);
      }

      displayProfileData(
        data.profile,
        dailyCalories,
        dailyFoodEntries,
        dailyProtein,
        dailyCarbs,
        dailyWorkoutMinutes,
        dailyWorkoutEntries,
        dailyWorkoutSets,
        dailyWorkoutPlanLabel,
        totalWorkoutEntriesComputed,
        totalWorkoutSetsComputed,
        skinRoutineData,
        requiredSkinSteps,
        completedSkinSteps,
        skinIntensity,
      );
    } catch (error) {
      console.error("❌ Profil lekérési hiba:", error);
      profileContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff6a6a;">
                    <p>❌ Nem lehet kapcsolódni a szerverhez!</p>
                    <p style="font-size: 14px; margin-top: 10px;">Ellenőrizd, hogy a backend fut-e.</p>
                </div>
            `;
    }
  }

  // Profil adatok megjelenítése
  function displayProfileData(
    profile,
    dailyCalories,
    dailyFoodEntries = [],
    dailyProtein = 0,
    dailyCarbs = 0,
    dailyWorkoutMinutes = 0,
    dailyWorkoutEntries = 0,
    dailyWorkoutSets = 0,
    dailyWorkoutPlanLabel = "",
    totalWorkoutEntriesComputed = null,
    totalWorkoutSetsComputed = null,
    skinRoutineData = null,
    requiredSkinSteps = 0,
    completedSkinSteps = 0,
    skinIntensity = 0,
  ) {
    console.log("🎨 Profil megjelenítése:", profile);

    let { user, food, workout, personal } = profile;

    // Ha a backend még nem adott vissza személyes adatokat, próbáljuk meg localStorage-ból kiolvasni (Test oldal mentése)
    if (!personal) {
      try {
        const personalFromLs = localStorage.getItem("ascension_personal_v1");
        if (personalFromLs) {
          const parsed = JSON.parse(personalFromLs);
          personal = {
            age: parsed.age,
            weightKg: parsed.weight,
            heightCm: parsed.height,
            gender: parsed.gender,
            activityMultiplier: parsed.activity,
            goal: parsed.goal,
            experience: parsed.experience,
            updatedAt: null,
          };
          console.log(
            "ℹ️ Személyes adatok localStorage-ból töltve (fallback).",
          );
        }
      } catch (e) {
        console.warn("Személyes adatok localStorage fallback hiba:", e);
      }
    }

    // Dátum formázása
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const formatShortDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("hu-HU", {
        month: "short",
        day: "numeric",
      });
    };

    const mapGoal = (goal) => {
      if (!goal) return "-";
      if (goal === "deficit") return "Fogyás";
      if (goal === "maintain") return "Súlytartás";
      if (goal === "surplus") return "Tömegnövelés";
      return goal;
    };

    const mapExperience = (exp) => {
      if (!exp) return "-";
      if (exp === "beginner") return "Kezdő";
      if (exp === "intermediate") return "Középhaladó";
      if (exp === "advanced") return "Haladó";
      return exp;
    };

    const getSkinTypeLabel = (skinType) => {
      const labels = {
        normal: "Normál",
        dry: "Száraz",
        oily: "Zsíros",
        combination: "Vegyes",
        sensitive: "Érzékeny",
      };
      return labels[skinType] || skinType;
    };

    const getAgeGroupLabel = (ageGroup) => {
      const labels = {
        under_25: "25 év alatt",
        "25_35": "25-35 év",
        "35_45": "35-45 év",
        "45_55": "45-55 év",
        over_55: "55 év felett",
      };
      return labels[ageGroup] || ageGroup;
    };

    const mapActivity = (mult) => {
      if (!mult) return "-";
      const m = parseFloat(mult);
      if (m === 1.2) return "Ülő életmód";
      if (m === 1.375) return "Könnyű aktivitás (1-3 nap/hét)";
      if (m === 1.55) return "Közepes aktivitás (3-5 nap/hét)";
      if (m === 1.725) return "Aktív (6-7 nap/hét)";
      if (m === 1.9) return "Nagyon aktív (napi 2x edzés)";
      return `Aktivitási szorzó: ${m}`;
    };

    const getWorkoutFocusLabel = (planDayLabel) => {
      if (!planDayLabel) return "Nincs kiválasztott tervnap";
      const parts = String(planDayLabel).split("-");
      if (parts.length > 1) return parts.slice(1).join("-").trim();
      return planDayLabel;
    };

    const calculateNutritionTargets = () => {
      const age = Number(personal?.age || 0);
      const weight = Number(personal?.weightKg || 0);
      const height = Number(personal?.heightCm || 0);
      const gender = personal?.gender;
      const activity = Number(personal?.activityMultiplier || 0);
      const goal = personal?.goal;

      if (!age || !weight || !height || !gender || !activity || !goal) {
        return {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        };
      }

      const bmr =
        gender === "male"
          ? 10 * weight + 6.25 * height - 5 * age + 5
          : 10 * weight + 6.25 * height - 5 * age - 161;

      let targetCalories = bmr * activity;
      if (goal === "deficit") targetCalories -= 400;
      if (goal === "surplus") targetCalories += 300;
      if (targetCalories < 1200) targetCalories = 1200;

      const protein = Math.round(weight * 2);
      const fat = Math.round(((targetCalories * 0.25) / 9) * 10) / 10;
      const carbs =
        Math.round(((targetCalories - protein * 4 - fat * 9) / 4) * 10) / 10;

      return {
        calories: Math.round(targetCalories),
        protein,
        carbs: Math.max(0, carbs),
        fat: Math.max(0, fat),
      };
    };

    const getProgressPercent = (current, target) => {
      const c = Number(current || 0);
      const t = Number(target || 0);
      if (!t || t <= 0) return 0;
      return Math.min(100, Math.round((c / t) * 100));
    };

    const getDefaultSetsByExperience = (experience) => {
      if (experience === "beginner") return 3;
      if (experience === "intermediate") return 4;
      return 4;
    };

    const getPlanStructureByExperience = (experience) => {
      if (experience === "beginner") {
        return {
          "Hétfő - Teljes test": [
            "Guggolás",
            "Fekvenyomás",
            "Evezés csigán",
            "Vállnyomás",
          ],
          "Szerda - Teljes test": [
            "Guggolás",
            "Fekvenyomás",
            "Lehúzás mellhez",
            "Oldalemelés",
          ],
          "Péntek - Teljes test": [
            "Guggolás",
            "Fekvenyomás",
            "Evezés rúddal",
            "Tricepsz letolás",
          ],
        };
      }

      if (experience === "intermediate") {
        return {
          "Hétfő - Felsőtest": [
            "Fekvenyomás",
            "Ferde fekvenyomás",
            "Húzódzkodás",
            "Vállnyomás",
          ],
          "Kedd - Alsótest": ["Guggolás", "Lábtoló", "Román felhúzás"],
          "Csütörtök - Felsőtest": [
            "Fekvenyomás",
            "Döntött törzsű evezés",
            "Oldalemelés",
          ],
          "Péntek - Alsótest": ["Guggolás", "Lábtoló", "Vádli állva"],
        };
      }

      return {
        "Hétfő/Csütörtök - Push": [
          "Fekvenyomás",
          "Ferde fekvenyomás",
          "Vállnyomás",
        ],
        "Kedd/Péntek - Pull": ["Felhúzás", "Húzódzkodás", "T-bar evezés"],
        "Szerda/Szombat - Legs": ["Guggolás", "Lábtoló", "Román felhúzás"],
      };
    };

    const getSetTargetsByExperience = (experience) => {
      if (experience === "beginner") {
        return {
          "Hétfő - Teljes test": {
            Guggolás: 3,
            Fekvenyomás: 3,
            "Evezés csigán": 3,
            Vállnyomás: 3,
          },
          "Szerda - Teljes test": {
            Guggolás: 3,
            Fekvenyomás: 3,
            "Lehúzás mellhez": 3,
            Oldalemelés: 3,
          },
          "Péntek - Teljes test": {
            Guggolás: 3,
            Fekvenyomás: 3,
            "Evezés rúddal": 3,
            "Tricepsz letolás": 3,
          },
        };
      }

      if (experience === "intermediate") {
        return {
          "Hétfő - Felsőtest": {
            Fekvenyomás: 4,
            "Ferde fekvenyomás": 4,
            Húzódzkodás: 4,
            Vállnyomás: 3,
          },
          "Kedd - Alsótest": {
            Guggolás: 4,
            Lábtoló: 4,
            "Román felhúzás": 3,
          },
          "Csütörtök - Felsőtest": {
            Fekvenyomás: 4,
            "Döntött törzsű evezés": 4,
            Oldalemelés: 3,
          },
          "Péntek - Alsótest": {
            Guggolás: 4,
            Lábtoló: 4,
            "Vádli állva": 4,
          },
        };
      }

      return {
        "Hétfő/Csütörtök - Push": {
          Fekvenyomás: 4,
          "Ferde fekvenyomás": 4,
          Vállnyomás: 4,
        },
        "Kedd/Péntek - Pull": {
          Felhúzás: 4,
          Húzódzkodás: 4,
          "T-bar evezés": 4,
        },
        "Szerda/Szombat - Legs": {
          Guggolás: 4,
          Lábtoló: 4,
          "Román felhúzás": 4,
        },
      };
    };

    const normalizeDayToken = (value) =>
      String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s*[-]\s*.*/, "")
        .replace(/[()]/g, "")
        .trim();

    const doesPlanDayMatchToday = (planDayLabel, todayName) => {
      if (!planDayLabel || !todayName) return false;
      const normalized = normalizeDayToken(planDayLabel);
      const todayNormalized = normalizeDayToken(todayName);
      return normalized
        .split("/")
        .map((part) => part.trim())
        .some((part) => part === todayNormalized);
    };

    const getRequiredWorkoutSetsToday = () => {
      try {
        const todayName = new Date().toLocaleDateString("hu-HU", {
          weekday: "long",
        });
        const savedPlanRaw = localStorage.getItem("ascension_training_plan_v1");
        if (!savedPlanRaw) return 0;

        const savedPlan = JSON.parse(savedPlanRaw);
        const experience =
          savedPlan?.experience || personal?.experience || "beginner";
        const fallbackSets = getDefaultSetsByExperience(experience);
        const structure =
          savedPlan?.planStructure &&
          Object.keys(savedPlan.planStructure).length > 0
            ? savedPlan.planStructure
            : getPlanStructureByExperience(experience);
        const setTargets =
          savedPlan?.setTargets && Object.keys(savedPlan.setTargets).length > 0
            ? savedPlan.setTargets
            : getSetTargetsByExperience(experience);
        const exercisesFallback = Array.isArray(savedPlan?.exercises)
          ? savedPlan.exercises
          : [];

        let requiredSets = 0;
        const structureEntries = Object.entries(structure);
        let iterableEntries =
          structureEntries.length > 0
            ? structureEntries
            : [[todayName, exercisesFallback]];

        if (dailyWorkoutPlanLabel && structure[dailyWorkoutPlanLabel]) {
          iterableEntries = [
            [dailyWorkoutPlanLabel, structure[dailyWorkoutPlanLabel]],
          ];
        }

        iterableEntries.forEach(([dayName, exercises]) => {
          if (dailyWorkoutPlanLabel && dayName !== dailyWorkoutPlanLabel)
            return;
          if (
            !dailyWorkoutPlanLabel &&
            !doesPlanDayMatchToday(dayName, todayName)
          )
            return;
          if (!Array.isArray(exercises)) return;
          exercises.forEach((exercise) => {
            const dayTargets = setTargets?.[dayName] || {};
            const target = Number(dayTargets?.[exercise] || fallbackSets);
            requiredSets += Number.isFinite(target) ? target : fallbackSets;
          });
        });

        if (requiredSets === 0 && exercisesFallback.length > 0) {
          requiredSets = exercisesFallback.length * fallbackSets;
        }

        return requiredSets;
      } catch (error) {
        console.warn("Napi kötelező szett számítási hiba:", error);
        return 0;
      }
    };

    const totalWorkoutEntriesAll = Number.isFinite(
      Number(totalWorkoutEntriesComputed),
    )
      ? Number(totalWorkoutEntriesComputed)
      : Number(workout?.total?.entries || 0);
    const totalWorkoutSetsAll = Number.isFinite(
      Number(totalWorkoutSetsComputed),
    )
      ? Number(totalWorkoutSetsComputed)
      : Number(workout?.total?.totalSets || 0);
    const requiredWorkoutSetsToday = getRequiredWorkoutSetsToday();
    const workoutFocusLabel = getWorkoutFocusLabel(dailyWorkoutPlanLabel);
    const nutritionTargets = calculateNutritionTargets();
    const dailyFat = Math.max(
      0,
      Math.round(
        ((dailyCalories - dailyProtein * 4 - dailyCarbs * 4) / 9) * 10,
      ) / 10,
    );
    const calorieIntensity = getProgressPercent(
      dailyCalories,
      nutritionTargets.calories,
    );
    const proteinIntensity = getProgressPercent(
      dailyProtein,
      nutritionTargets.protein,
    );
    const carbsIntensity = getProgressPercent(
      dailyCarbs,
      nutritionTargets.carbs,
    );
    const fatIntensity = getProgressPercent(dailyFat, nutritionTargets.fat);
    const workoutIntensity =
      requiredWorkoutSetsToday > 0
        ? Math.min(
            100,
            Math.round(
              (Number(dailyWorkoutSets || 0) / requiredWorkoutSetsToday) * 100,
            ),
          )
        : 0;

    // Tabs + két nézet: Statisztikák / Adatok
    let html = `
            <div class="profile-tabs">
                <button id="profile-show-stats" class="profile-mode-btn active">Statisztikák</button>
                <button id="profile-show-data" class="profile-mode-btn">Adatok</button>
            </div>

            <div id="profile-stats-view">
                <div class="profile-section profile-section-cyber">
                    <h3>👤 Felhasználói adatok</h3>
                    <article class="profile-account-card">
                      <div class="profile-account-head">
                        <div class="profile-account-avatar">${String(
                          user.username || "U",
                        )
                          .charAt(0)
                          .toUpperCase()}</div>
                        <div>
                          <div class="profile-account-name">${user.username}</div>
                          <div class="profile-account-role">Aktív Ascension fiók</div>
                        </div>
                      </div>

                      <div class="profile-account-grid">
                        <div class="profile-account-item">
                          <span class="profile-account-label">Felhasználónév</span>
                          <span class="profile-account-value">${user.username}</span>
                        </div>
                        <div class="profile-account-item">
                          <span class="profile-account-label">E-mail</span>
                          <span class="profile-account-value">${user.email}</span>
                        </div>
                        <div class="profile-account-item">
                          <span class="profile-account-label">Regisztráció dátuma</span>
                          <span class="profile-account-value">${formatDate(user.createdAt)}</span>
                        </div>
                      </div>
                    </article>
                </div>

                <div class="profile-section profile-section-cyber">
                    <h3>🍎 Kalória számláló statisztikák</h3>
                  <div class="profile-kpi-grid">
                    <article class="profile-kpi-card profile-kpi-primary profile-kpi-wide profile-nutrition-card">
                      <div class="kpi-badge">Napi kalória cél</div>
                      <div class="kpi-title">Napi kalória cél</div>
                      <div class="nutrition-main-value">${Math.round(dailyCalories)} <span>kcal</span></div>
                      <div class="kpi-progress-explainer">Teljesítve: ${Math.round(dailyCalories)} / ${Math.round(nutritionTargets.calories)} kcal (${calorieIntensity}%)</div>
                      <div class="kpi-track nutrition-main-track"><span style="width: ${calorieIntensity}%;"></span></div>

                      <div class="nutrition-macro-list">
                        <div class="nutrition-macro-row">
                          <div class="nutrition-macro-text">Fehérje: ${Math.round(dailyProtein)} / ${Math.round(nutritionTargets.protein)} g</div>
                          <div class="kpi-track nutrition-macro-track"><span style="width: ${proteinIntensity}%;"></span></div>
                        </div>
                        <div class="nutrition-macro-row">
                          <div class="nutrition-macro-text">Szénhidrát: ${Math.round(dailyCarbs)} / ${Math.round(nutritionTargets.carbs)} g</div>
                          <div class="kpi-track nutrition-macro-track"><span style="width: ${carbsIntensity}%;"></span></div>
                        </div>
                        <div class="nutrition-macro-row">
                          <div class="nutrition-macro-text">Zsír: ${Math.round(dailyFat)} / ${Math.round(nutritionTargets.fat)} g</div>
                          <div class="kpi-track nutrition-macro-track"><span style="width: ${fatIntensity}%;"></span></div>
                        </div>
                      </div>
                    </article>
                  </div>
                    <div style="margin-top: 18px; border-top: 1px solid #333; padding-top: 14px;">
                    <h4 class="profile-subheading">Mai bevitt ételek</h4>
                        ${
                          dailyFoodEntries.length === 0
                            ? `<div style="text-align: center; padding: 12px; color: #bdbdbd;"><p>Még nincsenek mai étel bejegyzések.</p></div>`
                            : `<div class="entries-list">${dailyFoodEntries
                                .map((entry) => {
                                  const formattedDate = formatShortDate(
                                    entry.date,
                                  );
                                  return `
                                <div class="entry-item">
                                    <div class="entry-header">
                                        <span class="entry-type">🥗 ${entry.foodName}</span>
                                        <span class="entry-date">${formattedDate}</span>
                                    </div>
                                    <div class="entry-details">
                                        <span>${entry.grams}g</span>
                                        <span>${Math.round(entry.calories)} kcal</span>
                                        <span>F: ${entry.proteinG}g</span>
                                        <span>SH: ${entry.carbsG}g</span>
                                    </div>
                                </div>
                              `;
                                })
                                .join("")}</div>`
                        }
                    </div>
                </div>

                <div class="profile-section profile-section-cyber">
                    <div class="profile-section-head">
                      <h3>🏋️ Edzés statisztikák</h3>
                      <button id="reset-workout-stats-btn" class="profile-reset-btn" type="button">Reset stat</button>
                    </div>
                  <div class="profile-kpi-grid">
                    <article class="profile-kpi-card profile-kpi-primary">
                      <div class="kpi-badge">TODAY</div>
                      <div class="kpi-title">Mai edzés: ${workoutFocusLabel}</div>
                      <div class="kpi-main">${Math.round(dailyWorkoutSets)} <span>szett</span></div>
                      <div class="kpi-sub">Teljesítve: ${Math.round(dailyWorkoutSets)} / ${Math.round(requiredWorkoutSetsToday)} szett</div>
                      <div class="kpi-track"><span style="width: ${workoutIntensity}%;"></span></div>
                    </article>

                    <article class="profile-kpi-card">
                      <div class="kpi-badge">TOTAL</div>
                      <div class="kpi-title">Összes szett</div>
                      <div class="kpi-main">${Math.round(totalWorkoutSetsAll)} <span>szett</span></div>
                      <div class="kpi-mini">
                        <p>${Math.round(totalWorkoutEntriesAll)} edzés bejegyzés</p>
                      </div>
                    </article>
                    </div>
                </div>

                <div class="profile-section profile-section-cyber">
                    <h3>🧴 Arcápolás statisztikák</h3>
                  <div class="profile-kpi-grid">
                    <article class="profile-kpi-card profile-kpi-primary">
                      <div class="kpi-badge">TODAY</div>
                      <div class="kpi-title">Napi arc cél teljesítés</div>
                      <div class="kpi-main">${Math.round(completedSkinSteps)} <span>/ ${Math.round(requiredSkinSteps)}</span></div>
                      <div class="kpi-sub">Teljesítve: ${Math.round(completedSkinSteps)} / ${Math.round(requiredSkinSteps)} lépés</div>
                      <div class="kpi-track"><span style="width: ${Math.round(skinIntensity)}%;"></span></div>
                    </article>

                    <article class="profile-kpi-card">
                      <div class="kpi-badge">STATUS</div>
                      <div class="kpi-title">Mai Arc progress</div>
                      <div class="kpi-main">${Math.round(skinIntensity)} <span>%</span></div>
                      <div class="kpi-mini">
                        <p>${skinRoutineData ? "Mentett rutin alapján" : "Nincs mentett arc rutin"}</p>
                      </div>
                    </article>
                    </div>
                </div>
        `;

    // stats-view lezárása
    html += `</div>`;

    // === ADATOK NÉZET ===
    html += `
            <div id="profile-data-view" style="display:none;">
                <div class="profile-section">
                    <h3>📋 Személyes adatok (Tervhez)</h3>
                    <div class="profile-info">
                        <p><strong>Életkor:</strong> ${personal && personal.age ? personal.age + " év" : "– nincs megadva –"}</p>
                        <p><strong>Súly:</strong> ${personal && personal.weightKg ? personal.weightKg + " kg" : "– nincs megadva –"}</p>
                        <p><strong>Magasság:</strong> ${personal && personal.heightCm ? personal.heightCm + " cm" : "– nincs megadva –"}</p>
                        <p><strong>Nem:</strong> ${personal && personal.gender ? (personal.gender === "male" ? "Férfi" : personal.gender === "female" ? "Nő" : personal.gender) : "– nincs megadva –"}</p>
                        <p><strong>Aktivitás:</strong> ${personal && personal.activityMultiplier ? mapActivity(personal.activityMultiplier) : "– nincs megadva –"}</p>
                        <p><strong>Cél:</strong> ${personal ? mapGoal(personal.goal) : "-"}</p>
                        <p><strong>Edzés tapasztalat:</strong> ${personal ? mapExperience(personal.experience) : "-"}</p>
                        ${personal && personal.updatedAt ? `<p><strong>Utoljára frissítve:</strong> ${formatDate(personal.updatedAt)}</p>` : ""}
                    </div>
                    <p style="font-size: 13px; color: #bdbdbd; margin-top: 8px;">Ezek az adatok a Test oldalon megadott űrlap alapján kerülnek mentésre.</p>
                </div>

                <div class="profile-section">
                    <h3>💪 Generált Edzésterv</h3>
                    <div class="profile-info">
                        ${(() => {
                          try {
                            const planData = JSON.parse(
                              localStorage.getItem(
                                "ascension_training_plan_v1",
                              ),
                            );
                            if (!planData) throw new Error("No plan");

                            const experienceNames = {
                              beginner: "Kezdő",
                              intermediate: "Haladó",
                              advanced: "Profi",
                            };

                            const goalNames = {
                              deficit: "Fogyás",
                              surplus: "Tömegnövelés",
                              maintain: "Tartás",
                            };

                            const exp =
                              experienceNames[planData.experience] ||
                              planData.experience;
                            const gol =
                              goalNames[planData.goal] || planData.goal;

                            if (planData.planHtml) {
                              const goalAdvice = planData.goalAdviceHtml || "";
                              return `
                                        <p><strong>Szint:</strong> ${exp}</p>
                                        <p><strong>Cél:</strong> ${gol}</p>
                                        <div style="margin-top: 12px;">
                                            ${planData.planHtml}
                                            ${goalAdvice}
                                        </div>
                                    `;
                            }

                            let fallbackHtml = "";
                            if (
                              planData.planStructure &&
                              Object.keys(planData.planStructure).length > 0
                            ) {
                              fallbackHtml = Object.entries(
                                planData.planStructure,
                              )
                                .map(
                                  ([day, exercises]) => `
                                            <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                                                <p style="margin: 0 0 6px 0;"><strong>${day}</strong></p>
                                                <p style="margin: 0; color: #ddd;">${Array.isArray(exercises) ? exercises.join(", ") : "-"}</p>
                                            </div>
                                        `,
                                )
                                .join("");
                            } else {
                              fallbackHtml =
                                '<p style="color: #bdbdbd;">A részletes terv még nincs mentve.</p>';
                            }

                            return `<p><strong>Szint:</strong> ${exp}</p><p><strong>Cél:</strong> ${gol}</p>${fallbackHtml}`;
                          } catch (e) {
                            return '<p style="color: #bdbdbd;">Még nincs generált edzésterv.</p>';
                          }
                        })()}
                    </div>
                </div>

                <div class="profile-section profile-section-cyber">
                    <h3>🧴 Bőrápolási Rutin</h3>
                    ${
                      skinRoutineData
                        ? `
                    <div class="profile-skin-routine">
                      <div class="profile-skin-meta">
                        <div class="profile-skin-chip">
                          <span class="profile-skin-label">Bőrtípus</span>
                          <strong>${getSkinTypeLabel(skinRoutineData.skin_type)}</strong>
                        </div>
                        <div class="profile-skin-chip">
                          <span class="profile-skin-label">Korcsoport</span>
                          <strong>${getAgeGroupLabel(skinRoutineData.age_group)}</strong>
                        </div>
                        <div class="profile-skin-chip">
                          <span class="profile-skin-label">Létrehozva</span>
                          <strong>${formatDate(skinRoutineData.created_at)}</strong>
                        </div>
                            </div>
                            
                      <div class="profile-skin-grid">
                        <div class="profile-skin-card">
                                    <h4>🌅 Reggeli Rutin</h4>
                          <ul class="profile-skin-list">
                            ${(Array.isArray(skinRoutineData.morning_routine) ? skinRoutineData.morning_routine : []).map((step) => `<li>${step}</li>`).join("") || "<li>Még nincs mentett reggeli rutin.</li>"}
                                    </ul>
                                </div>
                                
                        <div class="profile-skin-card">
                                    <h4>🌙 Esti Rutin</h4>
                          <ul class="profile-skin-list">
                            ${(Array.isArray(skinRoutineData.evening_routine) ? skinRoutineData.evening_routine : []).map((step) => `<li>${step}</li>`).join("") || "<li>Még nincs mentett esti rutin.</li>"}
                                    </ul>
                                </div>
                                
                                ${
                                  skinRoutineData.weekly_treatments &&
                                  skinRoutineData.weekly_treatments.length > 0
                                    ? `
                        <div class="profile-skin-card">
                                    <h4>📅 Heti Kezelések</h4>
                          <ul class="profile-skin-list">
                                        ${skinRoutineData.weekly_treatments.map((treatment) => `<li>${treatment}</li>`).join("")}
                                    </ul>
                                </div>
                                `
                                    : ""
                                }
                                
                                ${
                                  skinRoutineData.product_recommendations &&
                                  skinRoutineData.product_recommendations
                                    .length > 0
                                    ? `
                                  <div class="profile-skin-card">
                                    <h4>🛍️ Ajánlott Termékek</h4>
                                    <ul class="profile-skin-list">
                                        ${skinRoutineData.product_recommendations.map((product) => `<li>${product}</li>`).join("")}
                                    </ul>
                                </div>
                                `
                                    : ""
                                }
                            </div>
                            
                            <div class="profile-skin-actions">
                              <button class="profile-routine-btn" onclick="window.location.href='./oldalak/menupontok/Arc.html'">
                                    🔄 Rutin Frissítése
                                </button>
                            </div>
                        </div>
                    `
                        : `
                          <div class="profile-skin-empty">
                            <p>Még nincs mentett bőrápolási rutinod.</p>
                            <button class="profile-routine-btn" onclick="window.location.href='./oldalak/menupontok/Arc.html'">
                                🧪 Rutin Készítése
                            </button>
                        </div>
                    `
                    }
                </div>
                
                <div class="profile-section" style="border-top: 1px solid #444; padding-top: 20px; margin-top: 20px;">
                    <button id="delete-profile-data-btn" style="background-color: #d32f2f; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        🗑️ Adatok Törlése és Újrakezdés
                    </button>
                    <p style="font-size: 12px; color: #bdbdbd; margin-top: 10px;">Ez törli az összes mentett személyes adatodat és edzéstervedet. Új adatok megadása után újra létre kell generálnod az edzéstervet.</p>
                </div>
            </div>
        `; // profile-data-view lezárás

    profileContent.innerHTML = html;

    // Tab váltás események
    const statsBtn = document.getElementById("profile-show-stats");
    const dataBtn = document.getElementById("profile-show-data");
    const statsView = document.getElementById("profile-stats-view");
    const dataView = document.getElementById("profile-data-view");

    if (statsBtn && dataBtn && statsView && dataView) {
      statsBtn.addEventListener("click", () => {
        statsView.style.display = "";
        dataView.style.display = "none";
        statsBtn.classList.add("active");
        dataBtn.classList.remove("active");
      });

      dataBtn.addEventListener("click", () => {
        statsView.style.display = "none";
        dataView.style.display = "";
        dataBtn.classList.add("active");
        statsBtn.classList.remove("active");
      });

      // Delete button
      const deleteBtn = document.getElementById("delete-profile-data-btn");
      if (deleteBtn) {
        deleteBtn.addEventListener("click", deleteProfileData);
      }

      const resetWorkoutBtn = document.getElementById(
        "reset-workout-stats-btn",
      );
      if (resetWorkoutBtn) {
        resetWorkoutBtn.addEventListener("click", resetWorkoutStats);
      }
    }
  }

  async function resetWorkoutStats() {
    if (
      !confirm(
        "Biztosan törölni szeretnéd az összes edzés bejegyzést? Ez csak teszteléshez ajánlott.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("❌ Bejelentkezés szükséges!");
        return;
      }

      const authHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      let resetDone = false;

      // Elsődleges út: backend bulk reset endpoint
      const bulkResponse = await fetch("http://localhost:3000/api/workout", {
        method: "DELETE",
        headers: authHeaders,
      });

      const bulkContentType = bulkResponse.headers.get("content-type") || "";
      if (bulkResponse.ok && bulkContentType.includes("application/json")) {
        const bulkData = await bulkResponse.json();
        if (bulkData.success) {
          resetDone = true;
        }
      }

      // Tartalék út: ha a bulk endpoint nem érhető el, törlünk egyenként
      if (!resetDone) {
        const listResponse = await fetch("http://localhost:3000/api/workout", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!listResponse.ok) {
          throw new Error("Nem sikerült lekérni az edzés bejegyzéseket");
        }

        const listData = await listResponse.json();
        if (!listData.success || !Array.isArray(listData.entries)) {
          throw new Error("Hibás válasz az edzés lista lekérésekor");
        }

        await Promise.all(
          listData.entries.map((entry) =>
            fetch(`http://localhost:3000/api/workout/${entry.id}`, {
              method: "DELETE",
              headers: authHeaders,
            }),
          ),
        );

        resetDone = true;
      }

      if (!resetDone) {
        throw new Error("A reset nem sikerült");
      }

      localStorage.removeItem("ascension_workouts_v1");
      alert("✅ Edzés statisztikák nullázva.");
      await fetchProfileData();
    } catch (error) {
      console.error("Edzés stat reset hiba:", error);
      alert("❌ Hiba a reset közben: " + error.message);
    }
  }

  // Profil modal bezárása
  if (profileClose) {
    profileClose.addEventListener("click", function () {
      profileModal.classList.remove("active");
      document.body.style.overflow = "auto";
      stopProfileDayWatcher();
    });
  }

  // Modal bezárása kattintásra a háttéren
  if (profileModal) {
    profileModal.addEventListener("click", function (e) {
      if (e.target === profileModal) {
        profileModal.classList.remove("active");
        document.body.style.overflow = "auto";
        stopProfileDayWatcher();
      }
    });
  }

  // Modal bezárása ESC billentyűre
  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      profileModal &&
      profileModal.classList.contains("active")
    ) {
      profileModal.classList.remove("active");
      document.body.style.overflow = "auto";
      stopProfileDayWatcher();
    }
  });

  // Kijelentkezés gomb
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      if (confirm("Biztosan ki szeretnél jelentkezni?")) {
        console.log("👋 Kijelentkezés...");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        alert("✅ Sikeresen kijelentkeztél!");
        location.reload();
      }
    });
  }
});

// Profil adatok törlésére
async function deleteProfileData() {
  if (
    !confirm(
      "⚠️ Biztosan törölni szeretnéd az összes adatodat? Ez nem vonható vissza!\n\nTöröl:\n- Személyes adatok (kor, súly, magasság, stb.)\n- Generált edzésterv\n- Étel és edzés előzmények",
    )
  ) {
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("❌ Bejelentkezés szükséges!");
      return;
    }

    // Adatok törlése a backendről
    const response = await fetch("http://localhost:3000/api/profile/details", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Backend hiba: " + response.statusText);
    }

    // localStorage adatok törlése
    localStorage.removeItem("ascension_training_plan_v1");
    localStorage.removeItem("ascension_workouts_v1");

    alert(
      "✅ Mind az összes adatod sikeresen törölve lett. Megnyíl a Test oldal az új adatok megadásához.",
    );

    // Átirányítás a test oldalra
    window.location.href = "./test.html";
  } catch (error) {
    console.error("Hiba az adatok törlésénél:", error);
    alert("❌ Hiba az adatok törlésénél: " + error.message);
  }
}
