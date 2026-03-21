/* ================================
   DASHBOARD JAVASCRIPT
   ================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Segédfüggvény: dátum formázása YYYY-MM-DD-re
  function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate() + 0).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Segédfüggvény: tetszőleges date érték normalizálása YYYY-MM-DD-re
  function normalizeDate(value) {
    if (!value) return null;
    if (typeof value === "string") {
      return value.slice(0, 10);
    }
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return formatDate(d);
  }

  function getDefaultSetsByExperience(experience) {
    if (experience === "advanced") return 5;
    if (experience === "intermediate") return 4;
    return 3;
  }

  function getPlanStructureByExperience(experience) {
    if (experience === "beginner") {
      return {
        "Hétfő - Felsőtest": ["Fekvenyomás", "Evezés", "Vállnyomás"],
        "Szerda - Teljes test": ["Guggolás", "Felhúzás", "Húzódzkodás"],
        "Péntek - Alsótest": ["Guggolás", "Lábtoló", "Vádli állva"],
      };
    }

    if (experience === "intermediate") {
      return {
        "Hétfő/Csütörtök - Push": [
          "Fekvenyomás",
          "Ferde fekvenyomás",
          "Vállnyomás",
        ],
        "Kedd/Péntek - Pull": ["Felhúzás", "Húzódzkodás", "T-bar evezés"],
        "Szerda/Szombat - Legs": ["Guggolás", "Lábtoló", "Román felhúzás"],
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
  }

  function getSetTargetsByExperience(experience) {
    if (experience === "beginner") {
      return {
        "Hétfő - Felsőtest": { Fekvenyomás: 3, Evezés: 3, Vállnyomás: 3 },
        "Szerda - Teljes test": { Guggolás: 3, Felhúzás: 3, Húzódzkodás: 3 },
        "Péntek - Alsótest": { Guggolás: 3, Lábtoló: 3, "Vádli állva": 3 },
      };
    }

    if (experience === "intermediate") {
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
    }

    return {
      "Hétfő/Csütörtök - Push": {
        Fekvenyomás: 5,
        "Ferde fekvenyomás": 5,
        Vállnyomás: 5,
      },
      "Kedd/Péntek - Pull": { Felhúzás: 5, Húzódzkodás: 5, "T-bar evezés": 5 },
      "Szerda/Szombat - Legs": {
        Guggolás: 5,
        Lábtoló: 5,
        "Román felhúzás": 5,
      },
    };
  }

  const normalizeDayToken = (value) =>
    String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s*[-]\s*.*/, "")
      .replace(/[()]/g, "")
      .trim();

  function doesPlanDayMatchToday(planDayLabel, todayName) {
    if (!planDayLabel || !todayName) return false;
    const normalized = normalizeDayToken(planDayLabel);
    const todayNormalized = normalizeDayToken(todayName);
    return normalized
      .split("/")
      .map((part) => part.trim())
      .some((part) => part === todayNormalized);
  }

  function resolveEffectivePlanDay(todayStr) {
    try {
      const ACTIVE_WORKOUT_DAY_KEY = "ascension_active_workout_day_v1";
      const ACTIVE_WORKOUT_DAY_DATE_KEY =
        "ascension_active_workout_day_date_v1";
      const selectedPlanDay = localStorage.getItem(ACTIVE_WORKOUT_DAY_KEY);
      const selectedPlanDayDate = localStorage.getItem(
        ACTIVE_WORKOUT_DAY_DATE_KEY,
      );
      const hasTodayOverride = selectedPlanDayDate === todayStr;

      const savedPlanRaw = localStorage.getItem("ascension_training_plan_v1");
      if (!savedPlanRaw) return "";

      const savedPlan = JSON.parse(savedPlanRaw);
      const structure = savedPlan?.planStructure || {};
      if (hasTodayOverride && selectedPlanDay && structure[selectedPlanDay]) {
        return selectedPlanDay;
      }

      const todayName = new Date().toLocaleDateString("hu-HU", {
        weekday: "long",
      });
      return (
        Object.keys(structure).find((dayLabel) =>
          doesPlanDayMatchToday(dayLabel, todayName),
        ) || ""
      );
    } catch (error) {
      console.warn("Edzésnap feloldási hiba:", error);
      return "";
    }
  }

  function getRequiredWorkoutSetsToday(effectivePlanDay) {
    try {
      const todayName = new Date().toLocaleDateString("hu-HU", {
        weekday: "long",
      });
      const savedPlanRaw = localStorage.getItem("ascension_training_plan_v1");
      if (!savedPlanRaw) return 0;

      const savedPlan = JSON.parse(savedPlanRaw);
      const experience = savedPlan?.experience || "beginner";
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

      if (effectivePlanDay && structure[effectivePlanDay]) {
        iterableEntries = [[effectivePlanDay, structure[effectivePlanDay]]];
      }

      iterableEntries.forEach(([dayName, exercises]) => {
        if (effectivePlanDay && dayName !== effectivePlanDay) return;
        if (!effectivePlanDay && !doesPlanDayMatchToday(dayName, todayName))
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
  }

  function updateWorkoutTaskProgress(
    workoutPercent,
    dailyWorkoutSets,
    requiredWorkoutSetsToday,
  ) {
    const taskCards = document.querySelectorAll(".task-card");
    taskCards.forEach((card) => {
      const title = card.querySelector(".task-title")?.textContent?.trim();
      if (title !== "Edzés") return;

      const progressFill = card.querySelector(".task-progress-fill");
      const progressText = card.querySelector(".task-progress-text");

      if (progressFill) {
        progressFill.style.width = `${workoutPercent}%`;
        progressFill.dataset.target = String(workoutPercent);
      }

      if (progressText) {
        progressText.dataset.locked = "1";
        if (requiredWorkoutSetsToday > 0) {
          progressText.textContent = `${workoutPercent}% (${Math.round(dailyWorkoutSets)}/${Math.round(requiredWorkoutSetsToday)} szett)`;
        } else {
          progressText.textContent = `${workoutPercent}% (nincs mai edzésterv)`;
        }
      }
    });
  }

  function updateSkinTaskProgress(
    skinPercent,
    completedSkinSteps,
    requiredSkinSteps,
    hasSkinRoutine,
  ) {
    const taskCards = document.querySelectorAll(".task-card");
    taskCards.forEach((card) => {
      const title = card.querySelector(".task-title")?.textContent?.trim();
      if (title !== "Arcápolás") return;

      const progressFill = card.querySelector(".task-progress-fill");
      const progressText = card.querySelector(".task-progress-text");

      if (progressFill) {
        progressFill.style.width = `${skinPercent}%`;
        progressFill.dataset.target = String(skinPercent);
      }

      if (progressText) {
        progressText.dataset.locked = "1";
        if (!hasSkinRoutine) {
          progressText.textContent = "0% (nincs mentett rutin)";
          return;
        }

        progressText.textContent = `${skinPercent}% (${Math.round(completedSkinSteps)}/${Math.round(requiredSkinSteps)} lépés)`;
      }
    });
  }

  function stripSkinStepLabel(value) {
    return String(value || "")
      .replace(/[^a-zA-Z0-9\s.,:()\-+/%áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getRequiredSkinStepsFromRoutine(routine) {
    const pickTopThree = (list) =>
      (Array.isArray(list) ? list : [])
        .map((step) => stripSkinStepLabel(step))
        .filter(Boolean)
        .slice(0, 3);

    return [
      ...pickTopThree(routine?.morning_routine),
      ...pickTopThree(routine?.evening_routine),
    ];
  }

  function getLocalSkinTrackingForToday(todayStr) {
    try {
      const raw = localStorage.getItem("ascension_skin_tracking_v1");
      if (!raw) return null;
      const map = JSON.parse(raw);
      if (!map || typeof map !== "object") return null;
      return map[todayStr] || null;
    } catch {
      return null;
    }
  }

  async function getDailySkinStats(headers, todayStr) {
    try {
      const routineRes = await fetch("http://localhost:3000/api/skin/routine", {
        headers,
      });
      const routineData = await routineRes.json();
      if (!routineData.success || !routineData.routine) {
        return {
          hasSkinRoutine: false,
          skinIntensity: 0,
          completedSkinSteps: 0,
          requiredSkinSteps: 0,
        };
      }

      const routine = routineData.routine;
      const requiredSteps = getRequiredSkinStepsFromRoutine(routine);
      const requiredSkinSteps = requiredSteps.length;

      if (requiredSkinSteps === 0) {
        return {
          hasSkinRoutine: true,
          skinIntensity: 0,
          completedSkinSteps: 0,
          requiredSkinSteps,
        };
      }

      let completedSkinSteps = 0;

      try {
        const trackingRes = await fetch(
          `http://localhost:3000/api/skin/tracking?routine_id=${encodeURIComponent(routine.id)}&date=${encodeURIComponent(todayStr)}`,
          { headers },
        );
        const trackingData = await trackingRes.json();

        if (trackingData.success && trackingData.tracking) {
          const backendDone = [
            ...(Array.isArray(trackingData.tracking.morning_steps)
              ? trackingData.tracking.morning_steps
              : []),
            ...(Array.isArray(trackingData.tracking.evening_steps)
              ? trackingData.tracking.evening_steps
              : []),
          ];

          const normalizedDone = backendDone.map((step) =>
            stripSkinStepLabel(step),
          );
          const matched = requiredSteps.filter((step) =>
            normalizedDone.includes(step),
          );
          completedSkinSteps = matched.length;
        }
      } catch (trackingErr) {
        console.warn("Skin tracking fetch hiba:", trackingErr);
      }

      if (completedSkinSteps === 0) {
        const localToday = getLocalSkinTrackingForToday(todayStr);
        if (
          localToday &&
          Array.isArray(localToday.completedStepIds) &&
          Number.isFinite(Number(localToday.completedCount))
        ) {
          completedSkinSteps = Math.max(0, Number(localToday.completedCount));
        }
      }

      completedSkinSteps = Math.min(requiredSkinSteps, completedSkinSteps);
      const skinIntensity = Math.min(
        100,
        Math.round((completedSkinSteps / requiredSkinSteps) * 100),
      );

      return {
        hasSkinRoutine: true,
        skinIntensity,
        completedSkinSteps,
        requiredSkinSteps,
      };
    } catch (error) {
      console.warn("Skin napi statisztika hiba:", error);
      return {
        hasSkinRoutine: false,
        skinIntensity: 0,
        completedSkinSteps: 0,
        requiredSkinSteps: 0,
      };
    }
  }

  // === HAMBURGER MENU FUNCTIONALITY ===
  const hamburgerMenu = document.getElementById("hamburger-menu");
  const mobileNav = document.getElementById("mobile-nav");
  const navClose = document.getElementById("nav-close");

  // Toggle mobile navigation
  if (hamburgerMenu && mobileNav) {
    hamburgerMenu.addEventListener("click", () => {
      hamburgerMenu.classList.toggle("active");
      mobileNav.classList.toggle("active");

      // Prevent body scroll when menu is open
      if (mobileNav.classList.contains("active")) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });
  }

  // Close mobile navigation
  if (navClose && mobileNav) {
    navClose.addEventListener("click", () => {
      hamburgerMenu.classList.remove("active");
      mobileNav.classList.remove("active");
      document.body.style.overflow = "";
    });
  }

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      mobileNav &&
      !mobileNav.contains(e.target) &&
      !hamburgerMenu.contains(e.target) &&
      mobileNav.classList.contains("active")
    ) {
      hamburgerMenu.classList.remove("active");
      mobileNav.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Close menu when pressing Escape key
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      mobileNav &&
      mobileNav.classList.contains("active")
    ) {
      hamburgerMenu.classList.remove("active");
      mobileNav.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // === PROFILE MODAL FUNCTIONALITY ===
  const profileBtn = document.getElementById("profile-btn");
  const authToggle = document.getElementById("auth-toggle");
  const profileModal = document.getElementById("profile-modal");
  const profileClose = document.querySelector(".profile-close");
  const logoutBtnModal = document.getElementById("logout-btn-modal");

  // Open profile modal - reuse the global openProfileModal from auth.js
  if (profileBtn) {
    profileBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (
        window.openProfileModal &&
        typeof window.openProfileModal === "function"
      ) {
        window.openProfileModal();
      }
    });
  }

  // Close profile modal
  if (profileClose && profileModal) {
    profileClose.addEventListener("click", () => {
      profileModal.classList.remove("active");
      document.body.style.overflow = "";
    });
  }

  // Close modal when clicking outside
  document.addEventListener("click", (e) => {
    if (
      profileModal &&
      profileModal.classList.contains("active") &&
      !profileModal.contains(e.target) &&
      !(profileBtn && profileBtn.contains(e.target)) &&
      !(authToggle && authToggle.contains(e.target))
    ) {
      profileModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // === LOGOUT FUNCTIONALITY ===
  const logoutBtn = document.getElementById("logout-btn");

  function handleLogout() {
    // Clear local storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    // Redirect to main page
    window.location.href = "../oldalak/main.html";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  if (logoutBtnModal) {
    logoutBtnModal.addEventListener("click", (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  // Segédfüggvény: hány napja van a rendszerben a felhasználó
  function getDaysInSystem(user) {
    if (!user || !user.createdAt) return 0;

    const created = new Date(user.createdAt);
    if (isNaN(created.getTime())) return 0;

    const now = new Date();
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // +1, hogy a regisztráció napja is számítson (min. 1 nap)
    return Math.max(1, diffDays + 1);
  }

  // === LOAD PROFILE DATA ===
  function loadProfileData() {
    const profileContent = document.getElementById("profile-content");
    if (!profileContent) return;

    // Get user data from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const daysInSystem = getDaysInSystem(user);

    // Simulate loading profile data
    profileContent.innerHTML = `
            <div class="profile-info">
                <div class="profile-avatar">
                    <img src="../assets/img/default-avatar.png" alt="Profilkép" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px; border: 3px solid var(--accent);" />
                </div>
                <h3 style="color: var(--accent); margin-bottom: 10px;">${user.username || "Felhasználó"}</h3>
                <p style="color: var(--muted); margin-bottom: 20px;">${user.email || "email@example.com"}</p>
                
                <div class="profile-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div style="text-align: center; padding: 20px; background: rgba(43, 43, 43, 0.8); border-radius: 8px;">
                        <h4 style="color: var(--accent); font-size: 1.5rem; margin-bottom: 5px;">${daysInSystem}</h4>
                        <p style="color: var(--muted); margin: 0;">Nap a rendszerben</p>
                    </div>
                    <div style="text-align: center; padding: 20px; background: rgba(43, 43, 43, 0.8); border-radius: 8px;">
                        <h4 style="color: var(--accent); font-size: 1.5rem; margin-bottom: 5px;">0.0</h4>
                        <p style="color: var(--muted); margin: 0;">PSL növekedés</p>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button style="width: 100%; background: rgba(255, 215, 0, 0.1); color: var(--accent); border: 1px solid rgba(255, 215, 0, 0.3); padding: 12px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255, 215, 0, 0.2)'" onmouseout="this.style.background='rgba(255, 215, 0, 0.1)'">
                        Beállítások módosítása
                    </button>
                    <button style="width: 100%; background: rgba(255, 255, 255, 0.1); color: var(--text); border: 1px solid rgba(255, 255, 255, 0.2); padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                        Előfizetés kezelése
                    </button>
                </div>
            </div>
        `;
  }

  // === TASK BUTTON FUNCTIONALITY ===
  const taskButtons = document.querySelectorAll(".task-btn");

  taskButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const taskCard = this.closest(".task-card");
      const taskTitle = taskCard.querySelector("h3").textContent;

      // Show notification or redirect based on task type
      switch (taskTitle) {
        case "Edzés":
          window.location.href = "./menupontok/Test.html";
          break;
        case "Arcápolás":
          window.location.href = "./menupontok/Arc.html";
          break;
        case "Mentális":
          window.location.href = "./menupontok/Mental.html";
          break;
        default:
          alert(`${taskTitle} beállítása hamarosan elérhető!`);
      }
    });
  });

  // === NAPI AKTIVITÁS ÉS PSL SZÁMÍTÁS ===
  async function calculateDailyStats(user) {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return { weeklyCompletion: 0, pslGrowth: 0.0 };
    }

    const now = new Date();
    const todayStr = formatDate(now);

    const createdAtDate =
      user && user.createdAt ? new Date(user.createdAt) : null;

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      const [foodRes, workoutRes] = await Promise.all([
        fetch(`http://localhost:3000/api/food/entries?date=${todayStr}`, {
          headers,
        }),
        fetch(
          `http://localhost:3000/api/workout?startDate=${todayStr}&endDate=${todayStr}`,
          { headers },
        ),
      ]);

      const foodData = await foodRes.json();
      const workoutData = await workoutRes.json();

      const foodEntries = foodData.success ? foodData.entries || [] : [];
      const workoutEntries = workoutData.success
        ? workoutData.entries || []
        : [];
      const effectivePlanDay = resolveEffectivePlanDay(todayStr);
      const filteredWorkoutEntries = effectivePlanDay
        ? workoutEntries.filter(
            (entry) => String(entry.workoutType || "") === effectivePlanDay,
          )
        : workoutEntries;
      const dailyWorkoutSets = filteredWorkoutEntries.reduce(
        (sum, entry) => sum + Number(entry.sets || 0),
        0,
      );
      const requiredWorkoutSetsToday =
        getRequiredWorkoutSetsToday(effectivePlanDay);
      const workoutIntensity =
        requiredWorkoutSetsToday > 0
          ? Math.min(
              100,
              Math.round(
                (Number(dailyWorkoutSets || 0) / requiredWorkoutSetsToday) *
                  100,
              ),
            )
          : 0;
      const {
        hasSkinRoutine,
        skinIntensity,
        completedSkinSteps,
        requiredSkinSteps,
      } = await getDailySkinStats(headers, todayStr);

      // Ha van createdAt és ma előtte regisztrált, ne számoljuk (elméletben ilyen nincs, de védelem)
      if (createdAtDate) {
        const createdDay = new Date(
          createdAtDate.getFullYear(),
          createdAtDate.getMonth(),
          createdAtDate.getDate(),
        );
        const currentDay = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        if (currentDay < createdDay) {
          return { dailyCompletion: 0, pslGrowth: 0.0 };
        }
      }

      // Pont csak akkor jár, ha 100%-os a teljesítés
      let completedTasks = 0;
      const maxTasks = 3;

      if (workoutIntensity >= 100) completedTasks++;
      if (skinIntensity >= 100) completedTasks++;

      const totalCompletedTasks = Math.min(maxTasks, completedTasks);

      const dailyCompletion =
        maxTasks === 0 ? 0 : Math.round((totalCompletedTasks / maxTasks) * 100);

      // PSL növekedés: 0–2.0 skála a napi kitöltés alapján
      const basePslGrowth = parseFloat(
        ((dailyCompletion / 100) * 2).toFixed(1),
      );
      const pslBonus = totalCompletedTasks >= 3 ? 1 : 0; // This line remains unchanged
      const pslGrowth = parseFloat((basePslGrowth + pslBonus).toFixed(1));

      return {
        dailyCompletion,
        pslGrowth,
        workoutIntensity,
        dailyWorkoutSets,
        requiredWorkoutSetsToday,
        hasSkinRoutine,
        skinIntensity,
        completedSkinSteps,
        requiredSkinSteps,
        completedTasks: totalCompletedTasks,
        maxTasks,
        pslBonus,
      };
    } catch (err) {
      console.error("❌ Napi statisztika számítás hiba:", err);
      return {
        dailyCompletion: 0,
        pslGrowth: 0.0,
        workoutIntensity: 0,
        dailyWorkoutSets: 0,
        requiredWorkoutSetsToday: 0,
        hasSkinRoutine: false,
        skinIntensity: 0,
        completedSkinSteps: 0,
        requiredSkinSteps: 0,
        completedTasks: 0,
        maxTasks: 3,
        pslBonus: 0,
      };
    }
  }

  // === UPDATE STATS ===
  async function updateStats() {
    // Felhasználó beolvasása a localStorage-ből
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const daysInSystem = getDaysInSystem(user);
    const {
      dailyCompletion,
      pslGrowth,
      workoutIntensity,
      dailyWorkoutSets,
      requiredWorkoutSetsToday,
      hasSkinRoutine,
      skinIntensity,
      completedSkinSteps,
      requiredSkinSteps,
      completedTasks,
      maxTasks,
      pslBonus,
    } = await calculateDailyStats(user);

    const statValues = document.querySelectorAll(".stat-card .stat-value");
    const statChanges = document.querySelectorAll(".stat-card .stat-change");
    if (statValues.length >= 3) {
      statValues[0].textContent = String(daysInSystem);
      statValues[1].textContent = pslGrowth.toFixed(1);
      statValues[2].textContent = `${dailyCompletion}%`;
    }
    if (statChanges.length >= 3) {
      statChanges[0].textContent = `+${Math.max(0, daysInSystem - 1)} ma`;
      statChanges[1].textContent = `+${pslGrowth.toFixed(1)}%${pslBonus ? " (bónusz +1)" : ""}`;
      statChanges[2].textContent = `${completedTasks}/${maxTasks} feladat`;
    }

    const dailyProgressFill = document.querySelector(".daily-progress-fill");
    if (dailyProgressFill) {
      dailyProgressFill.style.width = `${dailyCompletion}%`;
      dailyProgressFill.dataset.target = String(dailyCompletion);
    }

    const dailyProgressLabel = document.querySelector(".daily-progress-label");
    if (dailyProgressLabel) {
      dailyProgressLabel.textContent = `Daily Progress – ${completedTasks}/${maxTasks} completed (${dailyCompletion}%)`;
    }

    const dailyProgressContainer = document.querySelector(
      ".daily-progress-container",
    );
    if (dailyProgressContainer) {
      let congrats = document.getElementById("daily-congrats");
      if (completedTasks >= 3) {
        if (!congrats) {
          congrats = document.createElement("div");
          congrats.id = "daily-congrats";
          congrats.className = "daily-congrats";
          dailyProgressContainer.appendChild(congrats);
        }
        congrats.textContent =
          "Gratulálok! 3/3 teljesítve, kaptál +1 PSL növekedést!";
      } else if (congrats) {
        congrats.remove();
      }
    }

    updateWorkoutTaskProgress(
      workoutIntensity,
      dailyWorkoutSets,
      requiredWorkoutSetsToday,
    );

    updateSkinTaskProgress(
      skinIntensity,
      completedSkinSteps,
      requiredSkinSteps,
      hasSkinRoutine,
    );
  }

  // Initialize stats
  updateStats();

  let lastDashboardDateKey = formatDate(new Date());
  setInterval(() => {
    const currentDateKey = formatDate(new Date());
    if (currentDateKey !== lastDashboardDateKey) {
      lastDashboardDateKey = currentDateKey;
      updateStats();
    }
  }, 30000);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    const currentDateKey = formatDate(new Date());
    if (currentDateKey !== lastDashboardDateKey) {
      lastDashboardDateKey = currentDateKey;
      updateStats();
    }
  });

  // === CHECK AUTHENTICATION ===
  function checkAuth() {
    const token = localStorage.getItem("authToken");
    if (!token) {
      // Redirect to main page if not authenticated
      window.location.href = "../oldalak/main.html";
      return false;
    }
    return true;
  }

  // Check authentication on load
  if (!checkAuth()) {
    return; // Stop execution if not authenticated
  }

  console.log("Dashboard loaded successfully!");
});
