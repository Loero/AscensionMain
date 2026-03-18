// Test.html JavaScript funkciók

// LocalStorage kulcsok
const STORAGE_KEY = "ascension_workouts";
const USER_DATA_KEY = "ascension_user_data";
const PLAN_KEY = "ascension_current_plan";

// Aktuális edzésterv gyakorlatai
let currentExercises = [];
// Napi étel tételek (localStorage-ból töltve)
let foodEntries = [];
let selectedFood = null; // {fdcId, description, nutrients: {energyKcal, proteinG, carbG}}

// Oldal betöltésekor
document.addEventListener("DOMContentLoaded", () => {
  // Tárolt felhasználói adatok betöltése
  loadUserData();

  // Tárolt edzésterv betöltése
  loadSavedPlan();

  // Kalória számláló inicializálás
  initFoodTracker();
});

// Felhasználói adatok mentése
function saveUserData() {
  const userData = {
    age: document.getElementById("age").value,
    weight: document.getElementById("weight").value,
    height: document.getElementById("height").value,
    gender: document.getElementById("gender").value,
    activity: document.getElementById("activity").value,
    goal: document.getElementById("goal").value,
    experience: document.getElementById("experience").value,
  };
  localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
}

// Felhasználói adatok betöltése
function loadUserData() {
  const saved = localStorage.getItem(USER_DATA_KEY);
  if (saved) {
    const userData = JSON.parse(saved);
    document.getElementById("age").value = userData.age || "";
    document.getElementById("weight").value = userData.weight || "";
    document.getElementById("height").value = userData.height || "";
    document.getElementById("gender").value = userData.gender || "";
    document.getElementById("activity").value = userData.activity || "";
    document.getElementById("goal").value = userData.goal || "";
    document.getElementById("experience").value = userData.experience || "";
  }
}

// Kalória és edzésterv generálás
function calculateAndGenerate() {
  // Input értékek
  const age = parseInt(document.getElementById("age").value);
  const weight = parseFloat(document.getElementById("weight").value);
  const height = parseFloat(document.getElementById("height").value);
  const gender = document.getElementById("gender").value;
  const activity = parseFloat(document.getElementById("activity").value);
  const goal = document.getElementById("goal").value;
  const experience = document.getElementById("experience").value;

  // Validáció
  if (
    !age ||
    !weight ||
    !height ||
    !gender ||
    !activity ||
    !goal ||
    !experience
  ) {
    alert("Kérlek töltsd ki az összes mezőt!");
    return;
  }

  // Adatok mentése
  saveUserData();

  // BMR kalkuláció (Mifflin-St Jeor formula)
  let bmr;
  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  // TDEE (Total Daily Energy Expenditure)
  const tdee = bmr * activity;

  // Cél kalória
  let goalCalories;
  let goalText;
  switch (goal) {
    case "deficit":
      goalCalories = tdee - 500; // 500 kcal deficit
      goalText = "Fogyás (-500 kcal)";
      break;
    case "maintain":
      goalCalories = tdee;
      goalText = "Tartás (fenntartó)";
      break;
    case "surplus":
      goalCalories = tdee + 300; // 300 kcal többlet
      goalText = "Tömegnövelés (+300 kcal)";
      break;
  }

  // Makrók számítás
  const protein = weight * 2.2; // 2.2g / kg testsúly
  const proteinCal = protein * 4;

  const fat = weight * 1; // 1g / kg testsúly
  const fatCal = fat * 9;

  const carbCal = goalCalories - proteinCal - fatCal;
  const carb = carbCal / 4;

  // Eredmények megjelenítése
  document.getElementById("bmr-value").textContent = `${Math.round(bmr)} kcal`;
  document.getElementById("tdee-value").textContent = `${Math.round(
    tdee
  )} kcal`;
  document.getElementById("goal-value").textContent = `${Math.round(
    goalCalories
  )} kcal (${goalText})`;

  document.getElementById("protein-value").textContent = `Fehérje: ${Math.round(
    protein
  )}g (${Math.round(proteinCal)} kcal)`;
  document.getElementById("fat-value").textContent = `Zsír: ${Math.round(
    fat
  )}g (${Math.round(fatCal)} kcal)`;
  document.getElementById("carb-value").textContent = `Szénhidrát: ${Math.round(
    carb
  )}g (${Math.round(carbCal)} kcal)`;

  document.getElementById("calorie-result").style.display = "block";

  // Edzésterv generálás
  generateTrainingPlan(experience, goal);

  // Smooth scroll az eredményekhez
  document
    .getElementById("calorie-result")
    .scrollIntoView({ behavior: "smooth", block: "center" });
}

// Edzésterv generálás tapasztalat és cél alapján
function generateTrainingPlan(experience, goal) {
  const planContainer = document.getElementById("plan-container");
  let plan = "";
  let exercises = [];

  if (experience === "beginner") {
    exercises = [
      "Guggolás",
      "Fekvenyomás",
      "Húzódzkodás",
      "Vállnyomás",
      "Evezés",
    ];
    plan = `
            <div class="plan-card">
                <h4>Kezdő Fullbody Program (3x/hét)</h4>
                <div class="day-plan">
                    <h5>Hétfő/Szerda/Péntek:</h5>
                    <ul>
                        <li>Guggolás: 3x8-10</li>
                        <li>Fekvenyomás: 3x8-10</li>
                        <li>Húzódzkodás/Lat pulldown: 3x8-10</li>
                        <li>Vállnyomás: 3x10-12</li>
                        <li>Evezés: 3x10-12</li>
                    </ul>
                </div>
                <p class="plan-note">💡 Fókuszálj a technikára, növeld fokozatosan a súlyokat.</p>
            </div>
        `;
  } else if (experience === "intermediate") {
    exercises = [
      "Fekvenyomás",
      "Húzódzkodás",
      "Vállnyomás",
      "Evezés",
      "Guggolás",
      "Romániai felhúzás",
    ];
    plan = `
            <div class="plan-card">
                <h4>Haladó Upper/Lower Split (4x/hét)</h4>
                <div class="day-plan">
                    <h5>Hétfő/Csütörtök - Felső:</h5>
                    <ul>
                        <li>Fekvenyomás: 4x6-8</li>
                        <li>Húzódzkodás: 4x6-8</li>
                        <li>Vállnyomás: 3x8-10</li>
                        <li>Evezés: 3x8-10</li>
                    </ul>
                </div>
                <div class="day-plan">
                    <h5>Kedd/Szombat - Alsó:</h5>
                    <ul>
                        <li>Guggolás: 4x6-8</li>
                        <li>Romániai felhúzás: 3x8-10</li>
                    </ul>
                </div>
                <p class="plan-note">💡 Progressive overload minden héten!</p>
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
                    <h5>Hétfő/Csütörtök - Push:</h5>
                    <ul>
                        <li>Fekvenyomás: 4x5-6</li>
                        <li>Ferde fekvenyomás: 4x8-10</li>
                        <li>Vállnyomás: 4x8-10</li>
                    </ul>
                </div>
                <div class="day-plan">
                    <h5>Kedd/Péntek - Pull:</h5>
                    <ul>
                        <li>Felhúzás: 4x5-6</li>
                        <li>Húzódzkodás: 4x8-10</li>
                        <li>T-bar evezés: 4x8-10</li>
                    </ul>
                </div>
                <div class="day-plan">
                    <h5>Szerda/Szombat - Legs:</h5>
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

  // Cél specifikus tanácsok
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
  document.getElementById("training-plan").style.display = "block";

  // Mentés és tracker generálás
  currentExercises = exercises;
  localStorage.setItem(
    PLAN_KEY,
    JSON.stringify({ exercises, experience, goal })
  );
  generateExerciseInputs(exercises);
  document.getElementById("tracker-section").style.display = "block";
  loadWorkouts();
}

// Gyakorlat input mezők generálása
function generateExerciseInputs(exercises) {
  const container = document.getElementById("exercise-inputs");
  let html = '<div class="exercise-input-grid">';

  exercises.forEach((exercise) => {
    html += `
            <div class="exercise-input-item">
                <label>${exercise}</label>
                <input type="number" 
                       id="weight-${exercise.replace(/\s+/g, "-")}" 
                       placeholder="Súly (kg)" 
                       min="0" 
                       step="2.5"
                       class="weight-input">
            </div>
        `;
  });

  html += "</div>";
  container.innerHTML = html;
}

// Edzés session mentése
function saveWorkoutSession() {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const timestamp = now.getTime(); // Timestamp a pontos rendezéshez
  const sessionData = [];
  let hasData = false;

  currentExercises.forEach((exercise) => {
    const inputId = `weight-${exercise.replace(/\s+/g, "-")}`;
    const weightInput = document.getElementById(inputId);
    const weight = parseFloat(weightInput.value);

    if (weight && weight > 0) {
      hasData = true;
      sessionData.push({
        id: timestamp + Math.random(), // Egyedi ID
        exercise,
        weight,
        date: today,
        timestamp: timestamp, // Pontos időbélyeg a rendezéshez
      });
    }
  });

  if (!hasData) {
    alert("Adj meg legalább egy gyakorlat súlyát!");
    return;
  }

  // Mentés
  let workouts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  workouts.push(...sessionData);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));

  // Input mezők törlése
  currentExercises.forEach((exercise) => {
    const inputId = `weight-${exercise.replace(/\s+/g, "-")}`;
    document.getElementById(inputId).value = "";
  });

  // Lista frissítése
  loadWorkouts();

  alert("Edzés sikeresen mentve! 💪");
}

// Edzések betöltése és megjelenítése
function loadWorkouts() {
  const workouts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  const workoutList = document.getElementById("workout-list");

  if (workouts.length === 0) {
    workoutList.innerHTML =
      '<p class="no-data">Még nincsenek rögzített edzések.</p>';
    return;
  }

  // Csoportosítás gyakorlat szerint
  const grouped = {};
  workouts.forEach((w) => {
    if (!grouped[w.exercise]) {
      grouped[w.exercise] = [];
    }
    grouped[w.exercise].push(w);
  });

  let html = "";
  for (const [exercise, records] of Object.entries(grouped)) {
    // Rendezés timestamp/dátum szerint (legújabb először)
    records.sort((a, b) => {
      // Ha van timestamp, azt használjuk (pontosabb)
      if (a.timestamp && b.timestamp) {
        return b.timestamp - a.timestamp;
      }
      // Ha nincs, akkor dátum string alapján
      return new Date(b.date) - new Date(a.date);
    });

    html += `<div class="exercise-group">`;
    html += `<h5>${exercise}</h5>`;
    html += `<div class="progress-chart">`;

    records.forEach((w, index) => {
      const isLatest = index === 0;
      // Csak a legújabbnál számoljuk ki az előzőhöz képesti változást
      let improvement = null;

      if (isLatest && records.length > 1) {
        const previousWeight = parseFloat(records[1].weight);
        const currentWeight = parseFloat(w.weight);
        improvement = (
          ((currentWeight - previousWeight) / previousWeight) *
          100
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
                            ? `<span class="neutral">→ 0%</span>`
                            : ""
                        }
                    </div>
                    <button class="btn-delete" onclick="deleteWorkout(${
                      w.id
                    })">🗑️</button>
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
  if (savedPlan) {
    const { exercises } = JSON.parse(savedPlan);
    currentExercises = exercises;
    generateExerciseInputs(exercises);
    document.getElementById("tracker-section").style.display = "block";
    loadWorkouts();
  }
}

// Dátum formázás
function formatDate(dateStr) {
  const date = new Date(dateStr);
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
    // Reset inputs
    gramsInput.value = "";
    searchInput.value = "";
    selectedFood = null;
    resultsBox.classList.remove("open");
    resultsBox.innerHTML = "";
  });

  // Grams változására frissítsük az előnézetet
  gramsInput.addEventListener("input", () => {
    if (selectedFood) renderFoodPreview();
  });
}

async function searchFood(query) {
  try {
    const resultsBox = document.getElementById("food-results");
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
    const curr = inputEl.value;
    const firstMatch = items.find((i) =>
      (i.description || "").toLowerCase().startsWith(curr.toLowerCase())
    );
    if (firstMatch && curr.length > 0) {
      const suggestion = firstMatch.description;
      // Csak akkor egészítjük ki, ha továbbra is prefix
      if (suggestion.toLowerCase().startsWith(curr.toLowerCase())) {
        inputEl.value = suggestion;
        // Kijelöljük az automatikusan kiegészített részt
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
                  <div class="food-title"><strong>${
                    item.description
                  }</strong>${brand}</div>
                  <div class="food-macros100"><small>${
                    item.dataType
                  } • 100g: ${Math.round(kcal)} kcal • P: ${Math.round(
          p
        )}g • C: ${Math.round(c)}g</small></div>
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
            // vizuális kijelölés
            resultsBox
              .querySelectorAll(".food-result-item.selected")
              .forEach((s) => s.classList.remove("selected"));
            el.classList.add("selected");
            selectedFood = item;
            resultsBox.classList.remove("open");
            resultsBox.innerHTML = "";
            document.getElementById("food-search").value = item.description;
          }
        });
      }
    );
  } catch (e) {
    console.error("searchFood error", e);
    document.getElementById("food-results").innerHTML =
      '<div class="food-result-error">Hiba a keresésnél.</div>';
  }
}

async function addFoodEntry(item, grams) {
  const token = localStorage.getItem("authToken");
  
  const scale = grams / 100.0;
  const calories = roundNum((item.nutrients.energyKcal || 0) * scale);
  const proteinG = roundNum((item.nutrients.proteinG || 0) * scale);
  const carbG = roundNum((item.nutrients.carbG || 0) * scale);
  
  // Ha be van jelentkezve, mentjük a backend-be
  if (token) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const response = await fetch("http://localhost:3000/api/food/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          foodName: item.description,
          grams,
          calories,
          proteinG,
          carbsG: carbG,
          date
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Étel bejegyzés mentve az adatbázisba!');
      } else {
        console.error('❌ Étel mentés hiba:', data.error);
        alert('Hiba történt a mentés során: ' + data.error);
        return;
      }
    } catch (error) {
      console.error('❌ Hálózati hiba:', error);
      alert('Hálózati hiba történt. Ellenőrizd a kapcsolatot!');
      return;
    }
  }
  
  // LocalStorage mentés (fallback, vagy ha nincs bejelentkezve)
  const entry = {
    id: Date.now() + Math.random(),
    description: item.description,
    grams,
    energyKcal: calories,
    proteinG: proteinG,
    carbG: carbG,
  };
  foodEntries.push(entry);
  persistToday();
  renderFoodEntries();
}

// Hibás előző implementáció törölve; a fájl végén lévő javított verzió használatos.

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

// --- Javított, tiszta definíciók a kereséshez és listához ---
async function searchFood(query) {
  try {
    const resultsBox = document.getElementById("food-results");
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

    const listHtml = items
      .map((item) => {
        const kcal = item.nutrients?.energyKcal ?? "-";
        const p = item.nutrients?.proteinG ?? "-";
        const c = item.nutrients?.carbG ?? "-";
        const brand = item.brandOwner
          ? ` <span class="brand">(${item.brandOwner})</span>`
          : "";
        return `<div class="food-result-item" data-fdcid="${item.fdcId}">
                <div class="food-title"><strong>${
                  item.description
                }</strong>${brand}</div>
                <div class="food-macros100"><small>${
                  item.dataType
                } • 100g: ${Math.round(kcal)} kcal • P: ${Math.round(
          p
        )}g • C: ${Math.round(c)}g</small></div>
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
            document.getElementById("food-search").value = item.description;
            resultsBox.classList.remove("open");
            resultsBox.innerHTML = "";
            renderFoodPreview();
          }
        });
      }
    );
  } catch (e) {
    console.error("searchFood error", e);
    document.getElementById("food-results").innerHTML =
      '<div class="food-result-error">Hiba a keresésnél.</div>';
  }
}

function renderFoodEntries() {
  const list = document.getElementById("food-list");
  if (foodEntries.length === 0) {
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
  document.getElementById("total-calories").textContent = `Kalória: ${roundNum(
    totals.kcal
  )} kcal`;
  document.getElementById("total-protein").textContent = `Fehérje: ${roundNum(
    totals.p
  )} g`;
  document.getElementById("total-carbs").textContent = `Szénhidrát: ${roundNum(
    totals.c
  )} g`;

  // Frissítjük a fejlécben a darabszámot
  const countEl = document.getElementById("food-count");
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

// ====== ALKOHOL KÖVETŐ ======
const ALCOHOL_PRESETS = {
  "Sör (0.5L)": { ml: 500, percentage: 5, calories: 215 },
  "Bor (1dl)": { ml: 100, percentage: 12, calories: 85 },
  "Pezsgő (1dl)": { ml: 100, percentage: 12, calories: 90 },
  "Vodka (4cl)": { ml: 40, percentage: 40, calories: 90 },
  "Whisky (4cl)": { ml: 40, percentage: 40, calories: 90 },
  "Rum (4cl)": { ml: 40, percentage: 40, calories: 90 },
  "Gin (4cl)": { ml: 40, percentage: 40, calories: 90 },
  "Pálinka (5cl)": { ml: 50, percentage: 40, calories: 112 }
};

// Inicializálás: mai dátum beállítása
document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("alcohol-date");
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
  
  // Ital típus változás figyelése
  const drinkSelect = document.getElementById("alcohol-drink-type");
  if (drinkSelect) {
    drinkSelect.addEventListener("change", handleDrinkTypeChange);
  }
  
  // Alkohol bejegyzések betöltése
  loadAlcoholEntries();
});

function handleDrinkTypeChange() {
  const drinkType = document.getElementById("alcohol-drink-type").value;
  const customFields = document.getElementById("custom-alcohol-fields");
  
  if (drinkType === "custom") {
    customFields.style.display = "block";
  } else {
    customFields.style.display = "none";
  }
}

async function addAlcoholEntry() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Jelentkezz be az alkohol követés használatához!");
    return;
  }
  
  const drinkTypeSelect = document.getElementById("alcohol-drink-type").value;
  const date = new Date().toISOString().split('T')[0];
  
  if (!drinkTypeSelect) {
    alert("Válassz ital típust!");
    return;
  }
  
  let drinkType, amountMl, alcoholPercentage, calories;
  
  if (drinkTypeSelect === "custom") {
    drinkType = document.getElementById("alcohol-custom-name").value;
    amountMl = parseInt(document.getElementById("alcohol-amount").value);
    alcoholPercentage = parseFloat(document.getElementById("alcohol-percentage").value);
    
    if (!drinkType || !amountMl || !alcoholPercentage) {
      alert("Töltsd ki az összes egyéni mezőt!");
      return;
    }
    
    // Kalória számítás: alkohol = 7 kcal/g
    // Alkohol tömeg (g) = térfogat (ml) × alkohol% × 0.789 (alkohol sűrűsége)
    const alcoholGrams = (amountMl * alcoholPercentage / 100) * 0.789;
    calories = Math.round(alcoholGrams * 7);
  } else {
    const preset = ALCOHOL_PRESETS[drinkTypeSelect];
    drinkType = drinkTypeSelect;
    amountMl = preset.ml;
    alcoholPercentage = preset.percentage;
    calories = preset.calories;
  }
  
  try {
    const response = await fetch("http://localhost:3000/api/alcohol/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        drinkType,
        amountMl,
        alcoholPercentage,
        calories,
        date
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert("Alkohol bejegyzés sikeresen hozzáadva! 🍺");
      // Mezők törlése
      document.getElementById("alcohol-drink-type").value = "";
      document.getElementById("custom-alcohol-fields").style.display = "none";
      if (document.getElementById("alcohol-custom-name")) {
        document.getElementById("alcohol-custom-name").value = "";
      }
      if (document.getElementById("alcohol-amount")) {
        document.getElementById("alcohol-amount").value = "";
      }
      if (document.getElementById("alcohol-percentage")) {
        document.getElementById("alcohol-percentage").value = "";
      }
      
      // Lista frissítése
      loadAlcoholEntries();
    } else {
      alert("Hiba: " + data.error);
    }
  } catch (error) {
    console.error("Alkohol hozzáadás hiba:", error);
    alert("Hiba történt a mentés során!");
  }
}

async function loadAlcoholEntries() {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return; // Nincs bejelentkezve, nem töltjük be
  }
  
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const response = await fetch(`http://localhost:3000/api/alcohol/entries?date=${today}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      renderAlcoholEntries(data.entries);
    }
  } catch (error) {
    console.error("Alkohol betöltés hiba:", error);
  }
}

function renderAlcoholEntries(entries) {
  const list = document.getElementById("alcohol-list");
  
  if (!entries || entries.length === 0) {
    list.innerHTML = '<p class="no-data">Még nincs alkohol bejegyzés mára.</p>';
    document.getElementById("alcohol-count").textContent = "(0)";
    document.getElementById("alcohol-total-ml").textContent = "Mennyiség: 0 ml";
    document.getElementById("alcohol-total-calories").textContent = "Kalória: 0 kcal";
    document.getElementById("alcohol-total-count").textContent = "Italok száma: 0";
    return;
  }
  
  const html = entries.map(entry => `
    <div class="food-entry">
      <div class="food-entry-title">
        <span class="food-name">${entry.drink_type}</span>
        <span class="food-grams-badge">${entry.amount_ml} ml</span>
      </div>
      <button class="btn-delete btn-icon" onclick="deleteAlcoholEntry(${entry.id})" aria-label="Tétel törlése">🗑️</button>
      <div class="food-entry-macros">
        <div class="food-chip chip-kcal"><span class="chip-label">Kalória</span> <span class="chip-value">${entry.calories} kcal</span></div>
        <div class="food-chip chip-protein"><span class="chip-label">Alkohol</span> <span class="chip-value">${entry.alcohol_percentage}%</span></div>
      </div>
    </div>
  `).join("");
  
  list.innerHTML = html;
  
  // Összesítés
  const totals = entries.reduce((acc, entry) => {
    acc.ml += entry.amount_ml;
    acc.calories += entry.calories;
    acc.count += 1;
    return acc;
  }, { ml: 0, calories: 0, count: 0 });
  
  document.getElementById("alcohol-count").textContent = `(${totals.count})`;
  document.getElementById("alcohol-total-ml").textContent = `Mennyiség: ${totals.ml} ml`;
  document.getElementById("alcohol-total-calories").textContent = `Kalória: ${totals.calories} kcal`;
  document.getElementById("alcohol-total-count").textContent = `Italok száma: ${totals.count}`;
}

async function deleteAlcoholEntry(id) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Jelentkezz be!");
    return;
  }
  
  if (!confirm("Biztosan törlöd ezt az alkohol bejegyzést?")) {
    return;
  }
  
  try {
    const response = await fetch(`http://localhost:3000/api/alcohol/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      loadAlcoholEntries();
    } else {
      alert("Hiba: " + data.error);
    }
  } catch (error) {
    console.error("Alkohol törlés hiba:", error);
    alert("Hiba történt a törlés során!");
  }
}


