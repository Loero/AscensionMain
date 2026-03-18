// Test.html JavaScript funkciók

// LocalStorage kulcsok
const PLAN_KEY = "ascension_training_plan_v1";
const STORAGE_KEY = "ascension_workouts_v1";

// Globális gyakorlatszett a Progressive Overload Trackerhez
const ALL_EXERCISES = [
  // Mell
  "Fekvenyomás",
  "Ferde fekvenyomás",
  "Tolódzkodás",
  "Tárogatás gépen",
  // Hát
  "Felhúzás",
  "Húzódzkodás",
  "Lehúzás mellhez",
  "Evezés rúddal",
  "Döntött törzsű evezés",
  "T-bar evezés",
  "Evezés csigán",
  // Láb
  "Guggolás",
  "Előlguggolás",
  "Lábtoló",
  "Román felhúzás",
  "Kitörés",
  // Váll
  "Vállnyomás",
  "Oldalemelés",
  "Előreemelés",
  // Kar
  "Bicepsz rúddal",
  "Bicepsz kézisúllyal",
  "Kalapács bicepsz",
  "Tricepsz letolás csigán",
  "Francia nyomás",
  // Vádli
  "Vádli állva",
  "Vádli ülve"
];

let currentExercises = [];
let foodEntries = [];
let selectedFood = null;
let planStructure = null; // Az edzésterv szerkezete (nap/csoport + gyakorlatok)

function toIdSafe(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9áéíóöőúüű\s]/g, "")
    .replace(/\s+/g, "-");
}

function getPlanStructureByExperience(experience) {
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
    "Hétfő/Csütörtök - Push": ["Fekvenyomás", "Ferde fekvenyomás", "Vállnyomás"],
    "Kedd/Péntek - Pull": ["Felhúzás", "Húzódzkodás", "T-bar evezés"],
    "Szerda/Szombat - Legs": ["Guggolás", "Lábtoló", "Román felhúzás"],
  };
}

// ====== INIT ======
document.addEventListener("DOMContentLoaded", () => {
  try {
    loadSavedPlan();
  } catch (e) {
    console.error("loadSavedPlan error", e);
  }

  try {
    initFoodTracker();
  } catch (e) {
    console.error("initFoodTracker error", e);
  }

  try {
    loadPersonalDataIntoForm();
  } catch (e) {
    console.error("loadPersonalDataIntoForm error", e);
  }
});

// ====== KALÓRIA + EDZÉSTERV GENERÁLÁS ======
function calculateAndGenerate() {
  const age = parseInt(document.getElementById("age").value, 10);
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const gender = document.getElementById("gender").value;
  const activity = parseFloat(document.getElementById("activity").value);
  const goal = document.getElementById("goal").value; // deficit / maintain / surplus
  const experience = document.getElementById("experience").value; // beginner / intermediate / advanced

  if (!age || !weight || !height || !gender || !activity || !goal || !experience) {
    alert("Tölts ki minden mezőt a terv generálásához!");
    return;
  }

  // Ha be vagy jelentkezve, mentsük el ezeket a személyes adatokat a fiókodhoz
  savePersonalData({ age, weight, height, gender, activity, goal, experience }).catch((err) => {
    console.error("Személyes adatok mentési hiba:", err);
  });

  // BMR számítás (Mifflin-St Jeor)
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const tdee = bmr * activity;
  let targetCalories = tdee;
  if (goal === "deficit") {
    targetCalories = tdee - 400;
  } else if (goal === "surplus") {
    targetCalories = tdee + 300;
  }

  if (targetCalories < 1200) targetCalories = 1200;

  // Egyszerű makró felosztás: 2 g/ttkg fehérje, 25% zsír, maradék szénhidrát
  const proteinG = Math.round(weight * 2);
  const fatKcal = targetCalories * 0.25;
  const fatG = Math.round(fatKcal / 9);
  const usedKcal = proteinG * 4 + fatG * 9;
  const remainingKcal = Math.max(0, targetCalories - usedKcal);
  const carbG = Math.round(remainingKcal / 4);

  document.getElementById("bmr-value").textContent = `${Math.round(bmr)} kcal`;
  document.getElementById("tdee-value").textContent = `${Math.round(tdee)} kcal`;
  document.getElementById("goal-value").textContent = `${Math.round(targetCalories)} kcal`;
  document.getElementById("protein-value").textContent = `Fehérje: ${proteinG} g`;
  document.getElementById("fat-value").textContent = `Zsír: ${fatG} g`;
  document.getElementById("carb-value").textContent = `Szénhidrát: ${carbG} g`;

  const calorieSection = document.getElementById("calorie-result");
  if (calorieSection) calorieSection.style.display = "block";

  generateTrainingPlan(experience, goal);
}

// Személyes adatok mentése a backend-re (ha van authToken)
async function savePersonalData({ age, weight, height, gender, activity, goal, experience }) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Az adatok mentéséhez először jelentkezz be a fiókodba.");
    return; // vendég módban nem mentünk semmit
  }

  const payload = {
    age,
    weight,
    height,
    gender,
    activity,
    goal,
    experience,
  };

  try {
    const response = await fetch("http://localhost:3000/api/profile/details", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!data.success) {
      console.warn("Személyes adatok mentése sikertelen:", data.error);
      alert("Nem sikerült elmenteni az adataidat a fiókhoz. Nézd meg, hogy a backend fut-e, és a konzolban van-e hibaüzenet.");
    } else {
      console.log("✅ Személyes adatok mentve a profilhoz");
      alert("✅ Személyes adatok sikeresen elmentve a fiókodhoz!");
    }
  } catch (error) {
    console.error("Személyes adatok mentése közben hiba történt:", error);
    alert("Nem sikerült elérni a szervert az adatok mentéséhez. Ellenőrizd, hogy a backend fut-e (http://localhost:3000).");
  }
}

// Személyes adatok visszatöltése az űrlapba, ha a fiókban el vannak mentve
async function loadPersonalDataIntoForm() {
  const token = localStorage.getItem("authToken");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:3000/api/profile", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (!data.success || !data.profile || !data.profile.personal) return;

    const personal = data.profile.personal;
    let hasLoadedData = false;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (val === null || val === undefined || val === "") return;
      el.value = val;
      hasLoadedData = true;
    };

    setVal("age", personal.age);
    setVal("weight", personal.weightKg ?? personal.weight_kg);
    setVal("height", personal.heightCm ?? personal.height_cm);
    setVal("gender", personal.gender);
    setVal("activity", personal.activityMultiplier ?? personal.activity_multiplier);
    setVal("goal", personal.goal);
    setVal("experience", personal.experience);

    console.log("✅ Személyes adatok betöltve az űrlapba a profilból");

    // Ha sikerült betölteni adatokat, rejtsd el a személyes adatok formsectiont
    if (hasLoadedData) {
      const dataSection = document.querySelector(".data-input-section");
      if (dataSection) {
        dataSection.style.display = "none";
        console.log("✅ Mentett adatok észlelve, személyes adatok forma elrejtve");
      }
    }
  } catch (error) {
    console.error("Személyes adatok betöltési hiba:", error);
  }
}

function generateTrainingPlan(experience, goal) {
  const planContainer = document.getElementById("plan-container");
  if (!planContainer) return;

  let exercises = [];
  let plan = "";
  planStructure = getPlanStructureByExperience(experience);

  if (experience === "beginner") {
    exercises = [
      "Fekvenyomás",
      "Guggolás",
      "Evezés csigán",
      "Vállnyomás",
      "Lehúzás mellhez",
    ];

    plan = `
      <div class="plan-card">
        <h4>Kezdő Full Body (3x/hét)</h4>
        <div class="day-plan">
          <h5>Hétfő - Teljes test</h5>
          <ul>
            <li>Guggolás: 3x8-10</li>
            <li>Fekvenyomás: 3x8-10</li>
            <li>Evezés csigán: 3x10-12</li>
            <li>Vállnyomás: 3x10-12</li>
          </ul>
        </div>
        <div class="day-plan">
          <h5>Szerda - Teljes test</h5>
          <ul>
            <li>Guggolás: 3x8-10</li>
            <li>Fekvenyomás: 3x8-10</li>
            <li>Lehúzás mellhez: 3x10-12</li>
            <li>Oldalemelés: 3x12-15</li>
          </ul>
        </div>
        <div class="day-plan">
          <h5>Péntek - Teljes test</h5>
          <ul>
            <li>Guggolás: 3x8-10</li>
            <li>Fekvenyomás: 3x8-10</li>
            <li>Evezés rúddal: 3x8-10</li>
            <li>Tricepsz letolás: 3x12-15</li>
          </ul>
        </div>
      </div>
    `;
  } else if (experience === "intermediate") {
    exercises = [
      "Fekvenyomás",
      "Ferde fekvenyomás",
      "Guggolás",
      "Felhúzás",
      "Húzódzkodás",
      "Vállnyomás",
    ];

    plan = `
      <div class="plan-card">
        <h4>Haladó Upper / Lower (4x/hét)</h4>
        <div class="day-plan">
          <h5>Hétfő - Felsőtest</h5>
          <ul>
            <li>Fekvenyomás: 4x6-8</li>
            <li>Ferde fekvenyomás: 4x8-10</li>
            <li>Húzódzkodás: 4xAMRAP</li>
            <li>Vállnyomás: 3x8-10</li>
          </ul>
        </div>
        <div class="day-plan">
          <h5>Kedd - Alsótest</h5>
          <ul>
            <li>Guggolás: 4x6-8</li>
            <li>Lábtoló: 4x10-12</li>
            <li>Román felhúzás: 3x8-10</li>
          </ul>
        </div>
        <div class="day-plan">
          <h5>Csütörtök - Felsőtest</h5>
          <ul>
            <li>Fekvenyomás: 4x6-8</li>
            <li>Döntött törzsű evezés: 4x8-10</li>
            <li>Oldalemelés: 3x12-15</li>
          </ul>
        </div>
        <div class="day-plan">
          <h5>Péntek - Alsótest</h5>
          <ul>
            <li>Guggolás: 4x6-8</li>
            <li>Lábtoló: 4x10-12</li>
            <li>Vádli állva: 4x12-15</li>
          </ul>
        </div>
      </div>
    `;
  } else {
    // advanced
    exercises = [
      "Fekvenyomás",
      "Ferde fekvenyomás",
      "Vállnyomás",
      "Felhúzás",
      "Húzódzkodás",
      "T-bar evezés",
      "Guggolás",
      "Lábtoló",
      "Romániai felhúzás",
    ];

    plan = `
      <div class="plan-card">
        <h4>Profi Push/Pull/Legs (6x/hét)</h4>
        <div class="day-plan">
          <h5>Hétfő/Csütörtök - Push</h5>
          <ul>
            <li>Fekvenyomás: 4x5-6</li>
            <li>Ferde fekvenyomás: 4x8-10</li>
            <li>Vállnyomás: 4x8-10</li>
          </ul>
        </div>
        <div class="day-plan">
          <h5>Kedd/Péntek - Pull</h5>
          <ul>
            <li>Felhúzás: 4x5-6</li>
            <li>Húzódzkodás: 4x8-10</li>
            <li>T-bar evezés: 4x8-10</li>
          </ul>
        </div>
        <div class="day-plan">
          <h5>Szerda/Szombat - Legs</h5>
          <ul>
            <li>Guggolás: 4x5-6</li>
            <li>Lábtoló: 4x10-12</li>
            <li>Romániai felhúzás: 4x8-10</li>
          </ul>
        </div>
        <p class="plan-note">💡 Változtasd a gyakorlatokat 4-6 hetente!</p>
      </div>
    `;
  }

  // Cél specifikus tanács
  let goalAdvice = "";
  if (goal === "deficit") {
    goalAdvice =
      '<p class="goal-advice">🔥 Fogyás: Tartsd meg az erődet, fókuszálj a technikára.</p>';
  } else if (goal === "surplus") {
    goalAdvice =
      '<p class="goal-advice">💪 Tömegnövelés: Progresszíven növeld a súlyokat!</p>';
  } else {
    goalAdvice = '<p class="goal-advice">⚖️ Tartás: Tartsd az erőszinted.</p>';
  }

  planContainer.innerHTML = plan + goalAdvice;
  const trainingSection = document.getElementById("training-plan");
  if (trainingSection) trainingSection.style.display = "block";

  // Mentés és tracker generálás (csak terv mentése)
  currentExercises = exercises;
  localStorage.setItem(
    PLAN_KEY,
    JSON.stringify({
      exercises,
      experience,
      goal,
      planStructure,
      planHtml: plan,
      goalAdviceHtml: goalAdvice,
    })
  );

  // A tracker mindig az összes fontos gyakorlatot mutatja
  generateExerciseInputs();

  const trackerSection = document.getElementById("tracker-section");
  if (trackerSection) trackerSection.style.display = "block";
  loadWorkouts();
}

// ====== PROGRESSIVE OVERLOAD TRACKER ======
// Gyakorlat input mezők generálása az edzésterv szerkezete szerint csoportosítva
function generateExerciseInputs() {
  const container = document.getElementById("exercise-inputs");
  if (!container) return;

  let html = '<div class="exercise-input-grid">';

  // Ha van planStructure (edzésterv), az alapján csoportosítunk
  if (planStructure && Object.keys(planStructure).length > 0) {
    Object.entries(planStructure).forEach(([dayName, dayExercises]) => {
      html += `<h4 style="grid-column: 1 / -1; margin-top: 20px; color: #FFD700; border-bottom: 1px solid rgba(255,215,0,0.3); padding-bottom: 8px;">${dayName}</h4>`;
      
      dayExercises.forEach((exercise) => {
        const daySafe = toIdSafe(dayName);
        const exerciseSafe = toIdSafe(exercise);
        html += `
          <div class="exercise-input-item">
            <label>${exercise}</label>
            <input
              type="number"
              id="weight-${daySafe}-${exerciseSafe}"
              placeholder="Súly (kg)"
              min="0"
              step="2.5"
              class="weight-input"
            />
          </div>
        `;
      });
    });
  } else {
    // Fallback: összes gyakorlat az edzésterv nélkül
    ALL_EXERCISES.forEach((exercise) => {
      const idSafe = toIdSafe(exercise);
      html += `
        <div class="exercise-input-item">
          <label>${exercise}</label>
          <input
            type="number"
            id="weight-${idSafe}"
            placeholder="Súly (kg)"
            min="0"
            step="2.5"
            class="weight-input"
          />
        </div>
      `;
    });
  }

  html += "</div>";
  container.innerHTML = html;
}

// Edzés session mentése
function saveWorkoutSession() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const timestamp = now.getTime();
  const sessionData = [];
  let hasData = false;

  // Edzendő gyakorlatok: nap + gyakorlat párokban, ha van tervszerkezet
  const exercisesToCheck =
    planStructure && Object.keys(planStructure).length > 0
      ? Object.entries(planStructure).flatMap(([dayName, dayExercises]) =>
          dayExercises.map((exercise) => ({ dayName, exercise }))
        )
      : ALL_EXERCISES.map((exercise) => ({ dayName: "", exercise }));

  exercisesToCheck.forEach(({ dayName, exercise }) => {
    const inputId = dayName
      ? `weight-${toIdSafe(dayName)}-${toIdSafe(exercise)}`
      : `weight-${toIdSafe(exercise)}`;
    const weightInput = document.getElementById(inputId);
    const weight = parseFloat(weightInput && weightInput.value);

    if (weight && weight > 0) {
      hasData = true;
      sessionData.push({
        id: timestamp + Math.random(),
        exercise,
        dayName,
        weight,
        date: today,
        timestamp,
      });
    }
  });

  if (!hasData) {
    alert("Adj meg legalább egy gyakorlat súlyát!");
    return;
  }

  let workouts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  workouts.push(...sessionData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));

  exercisesToCheck.forEach(({ dayName, exercise }) => {
    const inputId = dayName
      ? `weight-${toIdSafe(dayName)}-${toIdSafe(exercise)}`
      : `weight-${toIdSafe(exercise)}`;
    const input = document.getElementById(inputId);
    if (input) input.value = "";
  });

  loadWorkouts();

  alert("Edzés sikeresen mentve! 💪");
}

// Edzések betöltése és megjelenítése
function loadWorkouts() {
  const workouts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const workoutList = document.getElementById("workout-list");
  if (!workoutList) return;

  if (workouts.length === 0) {
    workoutList.innerHTML =
      '<p class="no-data">Még nincsenek rögzített edzések.</p>';
    return;
  }

  const grouped = {};
  workouts.forEach((w) => {
    if (!grouped[w.exercise]) grouped[w.exercise] = [];
    grouped[w.exercise].push(w);
  });

  let html = "";
  for (const [exercise, records] of Object.entries(grouped)) {
    records.sort((a, b) => {
      if (a.timestamp && b.timestamp) return b.timestamp - a.timestamp;
      return new Date(b.date) - new Date(a.date);
    });

    html += `<div class="exercise-group">`;
    html += `<h5>${exercise}</h5>`;
    html += `<div class="progress-chart">`;

    records.forEach((w, index) => {
      const isLatest = index === 0;
      let improvement = null;

      if (isLatest && records.length > 1) {
        const previousWeight = parseFloat(records[1].weight);
        const currentWeight = parseFloat(w.weight);
        improvement = (
          ((currentWeight - previousWeight) / previousWeight) * 100
        ).toFixed(1);
      }

      html += `
        <div class="workout-entry ${isLatest ? "latest" : ""}">
          <div class="workout-info">
            <span class="workout-date">${formatDate(w.date)}</span>
            <span class="workout-details">${w.weight}kg</span>
            ${
              isLatest &&
              improvement !== null &&
              parseFloat(improvement) > 0
                ? `<span class="improvement">↗ +${improvement}%</span>`
                : isLatest &&
                  improvement !== null &&
                  parseFloat(improvement) < 0
                ? `<span class="decline">↘ ${improvement}%</span>`
                : isLatest &&
                  improvement !== null &&
                  parseFloat(improvement) === 0
                ? '<span class="neutral">→ 0%</span>'
                : ""
            }
          </div>
          <button class="btn-delete" onclick="deleteWorkout(${w.id})">🗑️</button>
        </div>
      `;
    });

    html += `</div></div>`;
  }

  workoutList.innerHTML = html;
}

// Edzés törlése
function deleteWorkout(id) {
  if (!confirm("Biztosan törlöd ezt az edzést?")) return;

  let workouts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  workouts = workouts.filter((w) => w.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  loadWorkouts();
}

// Mentett terv betöltése
function loadSavedPlan() {
  const savedPlan = localStorage.getItem(PLAN_KEY);
  if (!savedPlan) return;

  try {
    const { exercises, experience, goal, planStructure: savedPlanStructure } = JSON.parse(savedPlan);
    if (Array.isArray(exercises) && exercises.length > 0) {
      currentExercises = exercises;
    }
    planStructure =
      savedPlanStructure && Object.keys(savedPlanStructure).length > 0
        ? savedPlanStructure
        : getPlanStructureByExperience(experience);
    
    // Tracker mezők: az edzésterv szerkezete alapján csoportosítva
    generateExerciseInputs();
    const trackerSection = document.getElementById("tracker-section");
    if (trackerSection) trackerSection.style.display = "block";
    loadWorkouts();
  } catch (e) {
    console.error("loadSavedPlan parse error", e);
  }
}

// Dátum formázás
function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  const months = [
    "jan",
    "feb",
    "már",
    "ápr",
    "máj",
    "jún",
    "júl",
    "aug",
    "szep",
    "okt",
    "nov",
    "dec",
  ];
  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

// ====== NAPI KALÓRIA SZÁMLÁLÓ ======
function initFoodTracker() {
  const todayKey = getTodayKey();
  const saved = localStorage.getItem(todayKey);
  foodEntries = saved ? JSON.parse(saved) : [];
  renderFoodEntries();

  const searchInput = document.getElementById("food-search");
  const gramsInput = document.getElementById("food-grams");
  const addBtn = document.getElementById("add-food-btn");
  const resultsBox = document.getElementById("food-results");

  if (!searchInput || !gramsInput || !addBtn || !resultsBox) return;

  let debounceTimer;
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim();
    clearTimeout(debounceTimer);
    if (!q) {
      resultsBox.classList.remove("open");
      resultsBox.innerHTML = "";
      selectedFood = null;
      return;
    }
    debounceTimer = setTimeout(() => searchFood(q), 350);
  });

  addBtn.addEventListener("click", () => {
    const grams = parseFloat(gramsInput.value);
    if (!selectedFood) {
      alert("Válassz ki egy ételt a listából!");
      return;
    }
    if (!grams || grams <= 0) {
      alert("Adj meg érvényes gramm mennyiséget!");
      return;
    }
    addFoodEntry(selectedFood, grams);
    gramsInput.value = "";
    searchInput.value = "";
    selectedFood = null;
    resultsBox.classList.remove("open");
    resultsBox.innerHTML = "";
  });

  gramsInput.addEventListener("input", () => {
    if (selectedFood) renderFoodPreview();
  });
}

async function searchFood(query) {
  try {
    const resultsBox = document.getElementById("food-results");
    if (!resultsBox) return;
    resultsBox.classList.add("open");
    resultsBox.innerHTML = '<div class="food-result-loading">Keresés...</div>';

    const resp = await fetch(
      `http://localhost:3000/nutrition/search?query=${encodeURIComponent(
        query
      )}`
    );
    const data = await resp.json();
    const items = data.items || [];
    if (items.length === 0) {
      resultsBox.innerHTML =
        '<div class="food-result-empty">Nincs találat a kiválasztott adatbázisban.</div>';
      return;
    }

    // Inline autocompletion az első pontos találattal
    const inputEl = document.getElementById("food-search");
    const curr = inputEl ? inputEl.value : "";
    const firstMatch = items.find((i) =>
      (i.description || "").toLowerCase().startsWith(curr.toLowerCase())
    );
    if (inputEl && firstMatch && curr.length > 0) {
      const suggestion = firstMatch.description;
      if (suggestion.toLowerCase().startsWith(curr.toLowerCase())) {
        inputEl.value = suggestion;
        try {
          inputEl.setSelectionRange(curr.length, suggestion.length);
        } catch {}
      }
    }

    const listHtml = items
      .map((item) => {
        const kcal = item.nutrients?.energyKcal ?? "-";
        const p = item.nutrients?.proteinG ?? "-";
        const c = item.nutrients?.carbG ?? "-";
        const brand = item.brandOwner
          ? ` <span class="brand">(${item.brandOwner})</span>`
          : "";
        return `<div class="food-result-item" data-fdcid="${item.fdcId}">
          <div class="food-title"><strong>${item.description}</strong>${brand}</div>
          <div class="food-macros100"><small>${item.dataType} • 100g: ${Math.round(
          kcal
        )} kcal • P: ${Math.round(p)}g • C: ${Math.round(c)}g</small></div>
        </div>`;
      })
      .join("");

    resultsBox.innerHTML = listHtml;
    Array.from(resultsBox.querySelectorAll(".food-result-item")).forEach(
      (el) => {
        el.addEventListener("click", () => {
          const fdcId = parseInt(el.getAttribute("data-fdcid"), 10);
          const item = items.find((i) => i.fdcId === fdcId);
          if (item) {
            resultsBox
              .querySelectorAll(".food-result-item.selected")
              .forEach((s) => s.classList.remove("selected"));
            el.classList.add("selected");
            selectedFood = item;
            const input = document.getElementById("food-search");
            if (input) input.value = item.description;
            resultsBox.classList.remove("open");
            resultsBox.innerHTML = "";
            renderFoodPreview();
          }
        });
      }
    );
  } catch (e) {
    console.error("searchFood error", e);
    const box = document.getElementById("food-results");
    if (box) {
      box.innerHTML =
        '<div class="food-result-error">Hiba a keresésnél.</div>';
    }
  }
}

async function addFoodEntry(item, grams) {
  const token = localStorage.getItem("authToken");

  const scale = grams / 100.0;
  const calories = roundNum((item.nutrients.energyKcal || 0) * scale);
  const proteinG = roundNum((item.nutrients.proteinG || 0) * scale);
  const carbG = roundNum((item.nutrients.carbG || 0) * scale);

  if (token) {
    try {
      const date = new Date().toISOString().split("T")[0];
      const response = await fetch("http://localhost:3000/api/food/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          foodName: item.description,
          grams,
          calories,
          proteinG,
          carbsG: carbG,
          date,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error("❌ Étel mentés hiba:", data.error);
        alert("Hiba történt a mentés során: " + data.error);
        return;
      }
    } catch (error) {
      console.error("❌ Hálózati hiba:", error);
      alert("Hálózati hiba történt. Ellenőrizd a kapcsolatot!");
      return;
    }
  }

  const entry = {
    id: Date.now() + Math.random(),
    description: item.description,
    grams,
    energyKcal: calories,
    proteinG,
    carbG,
  };
  foodEntries.push(entry);
  persistToday();
  renderFoodEntries();
}

function deleteFoodEntry(id) {
  foodEntries = foodEntries.filter((e) => e.id !== id);
  persistToday();
  renderFoodEntries();
}

function persistToday() {
  localStorage.setItem(getTodayKey(), JSON.stringify(foodEntries));
}

function getTodayKey() {
  const today = new Date().toISOString().split("T")[0];
  return `ascension_food_${today}`;
}

function roundNum(n) {
  return Math.round(n * 10) / 10;
}

function renderFoodEntries() {
  const list = document.getElementById("food-list");
  if (!list) return;

  if (!foodEntries.length) {
    list.innerHTML = '<p class="no-data">Még nincs hozzáadott étel.</p>';
  } else {
    const html = foodEntries
      .map(
        (e) => `
      <div class="food-entry">
        <div class="food-entry-title">
          <span class="food-name">${e.description}</span>
          <span class="food-grams-badge">${e.grams} g</span>
        </div>
        <button class="btn-delete btn-icon" onclick="deleteFoodEntry(${e.id})" aria-label="Tétel törlése">🗑️</button>
        <div class="food-entry-macros">
          <div class="food-chip chip-kcal"><span class="chip-label">Kalória</span> <span class="chip-value">${e.energyKcal} kcal</span></div>
          <div class="food-chip chip-protein"><span class="chip-label">Fehérje</span> <span class="chip-value">${e.proteinG} g</span></div>
          <div class="food-chip chip-carb"><span class="chip-label">Szénhidrát</span> <span class="chip-value">${e.carbG} g</span></div>
        </div>
      </div>
    `
      )
      .join("");
    list.innerHTML = html;
  }

  const totals = foodEntries.reduce(
    (acc, e) => {
      acc.kcal += e.energyKcal;
      acc.p += e.proteinG;
      acc.c += e.carbG;
      return acc;
    },
    { kcal: 0, p: 0, c: 0 }
  );

  const totalCaloriesEl = document.getElementById("total-calories");
  const totalProteinEl = document.getElementById("total-protein");
  const totalCarbsEl = document.getElementById("total-carbs");
  const countEl = document.getElementById("food-count");

  if (totalCaloriesEl)
    totalCaloriesEl.textContent = `Kalória: ${roundNum(totals.kcal)} kcal`;
  if (totalProteinEl)
    totalProteinEl.textContent = `Fehérje: ${roundNum(totals.p)} g`;
  if (totalCarbsEl)
    totalCarbsEl.textContent = `Szénhidrát: ${roundNum(totals.c)} g`;
  if (countEl) countEl.textContent = `(${foodEntries.length})`;
}

function renderFoodPreview() {
  const box = document.getElementById("food-preview");
  if (!box) return;
  if (!selectedFood) {
    box.innerHTML = "";
    return;
  }

  const gramsInput = document.getElementById("food-grams");
  const grams = parseFloat(gramsInput && gramsInput.value) || 100;
  const scale = grams / 100.0;
  const kcal = roundNum((selectedFood.nutrients.energyKcal || 0) * scale);
  const p = roundNum((selectedFood.nutrients.proteinG || 0) * scale);
  const c = roundNum((selectedFood.nutrients.carbG || 0) * scale);

  box.innerHTML = `
    <div class="macro-grid">
      <div class="macro-item kcal"><span class="macro-label">Kalória</span><span class="macro-value">${kcal} kcal</span></div>
      <div class="macro-item protein"><span class="macro-label">Fehérje</span><span class="macro-value">${p} g</span></div>
      <div class="macro-item carb"><span class="macro-label">Szénhidrát</span><span class="macro-value">${c} g</span></div>
      <div class="macro-item macro-note"><span>${selectedFood.description}</span><span>${grams} g</span></div>
    </div>
  `;
}
