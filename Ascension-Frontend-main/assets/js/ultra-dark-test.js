// ================================
// ASCENSION SYSTEM - ULTRA-DARK LOOKSMAXXING TEST PAGE
// Masculine interactions and animations
// ================================

document.addEventListener("DOMContentLoaded", function () {
  // Initialize ultra-dark interactions
  initUltraDarkInteractions();

  // Initialize crimson glow effects
  initCrimsonGlow();

  // Initialize form interactions
  initFormInteractions();

  // Initialize ultra-dark food tracker visuals
  initUltraDarkFoodTracker();
});

// Initialize ultra-dark interactions
function initUltraDarkInteractions() {
  // Add hover effects to all buttons
  const buttons = document.querySelectorAll(
    ".btn-calculate, .btn-save-workout, .btn-back-home",
  );
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px) scale(1.02)";
      this.style.boxShadow =
        "inset 0 0 15px rgba(183, 28, 28, 0.3), 0 4px 20px rgba(0, 0, 0, 0.8), 0 0 20px rgba(183, 28, 28, 0.2)";
    });

    button.addEventListener("mouseleave", function () {
      this.style.transform = "";
      this.style.boxShadow = "";
    });

    // Add aggressive click feedback
    button.addEventListener("click", function (e) {
      this.style.transform = "scale(0.96)";
      setTimeout(() => {
        this.style.transform = "";
      }, 100);
    });
  });

  // Add hover effects to sections
  const sections = document.querySelectorAll(
    ".data-input-section, .result-section, .training-section, .tracker-section",
  );
  sections.forEach((section) => {
    section.addEventListener("mouseenter", function () {
      this.style.boxShadow =
        "0 8px 32px rgba(0, 0, 0, 0.9), 0 0 20px rgba(183, 28, 28, 0.2)";
    });

    section.addEventListener("mouseleave", function () {
      this.style.boxShadow = "";
    });
  });
}

// Initialize crimson glow effects
function initCrimsonGlow() {
  // Add pulsing glow to focused inputs
  const inputs = document.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      this.style.boxShadow =
        "inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 25px rgba(183, 28, 28, 0.3)";
    });

    input.addEventListener("blur", function () {
      this.style.boxShadow = "";
    });
  });

  // Add subtle glow to result cards
  const resultCards = document.querySelectorAll(".result-card");
  resultCards.forEach((card) => {
    setInterval(() => {
      if (card.classList.contains("highlight")) {
        card.style.borderColor = `rgba(183, 28, 28, ${Math.random() * 0.3 + 0.2})`;
      }
    }, 3000);
  });
}

// Initialize form interactions
function initFormInteractions() {
  // Add input validation with crimson feedback
  const requiredInputs = document.querySelectorAll(
    "input[required], select[required]",
  );
  requiredInputs.forEach((input) => {
    input.addEventListener("blur", function () {
      if (!this.value) {
        this.style.borderColor = "rgba(183, 28, 28, 0.5)";
        this.style.boxShadow =
          "inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 15px rgba(183, 28, 28, 0.3)";
      } else {
        this.style.borderColor = "rgba(183, 28, 28, 0.2)";
        this.style.boxShadow = "";
      }
    });

    input.addEventListener("input", function () {
      if (this.value) {
        this.style.borderColor = "rgba(183, 28, 28, 0.3)";
        this.style.boxShadow = "";
      }
    });
  });

  // Add button state management
  const calculateBtn = document.querySelector(".btn-calculate");
  if (calculateBtn) {
    calculateBtn.addEventListener("click", function () {
      this.textContent = "Számítás...";
      this.disabled = true;
      this.style.opacity = "0.7";

      setTimeout(() => {
        this.textContent = "Terv Generálása";
        this.disabled = false;
        this.style.opacity = "1";
      }, 1500);
    });
  }
}

// Initialize food tracker visuals (do not override the real tracker logic in test.js)
function initUltraDarkFoodTracker() {
  const addFoodBtn = document.getElementById("add-food-btn");
  const foodSearch = document.getElementById("food-search");
  const foodGrams = document.getElementById("food-grams");

  if (addFoodBtn) {
    addFoodBtn.addEventListener("click", function () {
      // Add loading state
      this.textContent = "Keresés...";
      this.disabled = true;
      this.style.opacity = "0.7";

      setTimeout(() => {
        this.textContent = "Hozzáadás";
        this.disabled = false;
        this.style.opacity = "1";

        // Clear inputs
        if (foodSearch) foodSearch.value = "";
        if (foodGrams) foodGrams.value = "";

        // Update food count
        updateFoodCount();
      }, 1000);
    });
  }

  // Add enter key support for food search
  if (foodSearch && foodGrams) {
    foodSearch.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        foodGrams.focus();
      }
    });

    foodGrams.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        if (addFoodBtn) addFoodBtn.click();
      }
    });
  }
}

// Update food count with crimson animation
function updateFoodCount() {
  const foodCount = document.getElementById("food-count");
  if (foodCount) {
    const currentCount = parseInt(foodCount.textContent.match(/\d+/)[0]) || 0;
    const newCount = currentCount + 1;

    // Animate the count
    foodCount.style.color = "#D32F2F";
    foodCount.style.transform = "scale(1.2)";

    setTimeout(() => {
      foodCount.textContent = `(${newCount})`;
      foodCount.style.color = "";
      foodCount.style.transform = "";
    }, 300);
  }
}

// Legacy demo function kept for reference; do not override the real Test page handler
function calculateAndGenerateUltraDark() {
  const btn = document.querySelector(".btn-calculate");
  const resultSection = document.getElementById("calorie-result");
  const trainingSection = document.getElementById("training-plan");

  // Get form values
  const experience = document.getElementById("experience")?.value;
  const goal = document.getElementById("goal")?.value;

  // Add loading state
  if (btn) {
    btn.textContent = "Számítás...";
    btn.disabled = true;
    btn.style.opacity = "0.7";
  }

  // Simulate calculation
  setTimeout(() => {
    // Show results with animations
    if (resultSection) {
      resultSection.style.display = "block";
      resultSection.style.animation = "fadeInUp 0.5s ease";
    }

    // Generate training plan
    if (experience && goal) {
      generateTrainingPlanUltraDark(experience, goal);
    }

    if (trainingSection) {
      trainingSection.style.display = "block";
      trainingSection.style.animation = "fadeInUp 0.6s ease 0.1s both";
    }

    // Update result values with animations
    animateResultValues();

    // Reset button
    if (btn) {
      btn.textContent = "Terv Generálása";
      btn.disabled = false;
      btn.style.opacity = "1";
    }
  }, 1500);
}

// Legacy demo function kept for reference; do not override the real Test page plan generator
function generateTrainingPlanUltraDark(experience, goal) {
  const planContainer = document.getElementById("plan-container");
  if (!planContainer) return;

  let plan = "";

  if (experience === "beginner") {
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
    plan = `
            <div class="plan-card">
                <h4>Profi PPL (6x/hét)</h4>
                <div class="day-plan">
                    <h5>Hétfő - Nyomás</h5>
                    <ul>
                        <li>Fekvenyomás: 5x3-5</li>
                        <li>Ferde fekvenyomás: 4x6-8</li>
                        <li>Vállnyomás: 4x8-10</li>
                        <li>Tricepsz letolás: 4x8-12</li>
                    </ul>
                </div>
                <div class="day-plan">
                    <h5>Kedd - Húzás</h5>
                    <ul>
                        <li>Húzódzkodás: 5xAMRAP</li>
                        <li>Lehúzás mellhez: 4x6-8</li>
                        <li>Döntött törzsű evezés: 4x8-10</li>
                        <li>Bicepsz hajlítás: 4x8-12</li>
                    </ul>
                </div>
                <div class="day-plan">
                    <h5>Szerda - Láb</h5>
                    <ul>
                        <li>Guggolás: 5x3-5</li>
                        <li>Lábtoló: 4x6-8</li>
                        <li>Román felhúzás: 4x6-8</li>
                        <li>Vádli: 4x10-15</li>
                    </ul>
                </div>
                <div class="day-plan">
                    <h5>Csütörtök - Nyomás</h5>
                    <ul>
                        <li>Fekvenyomás: 5x3-5</li>
                        <li>Ferde fekvenyomás: 4x6-8</li>
                        <li>Vállnyomás: 4x8-10</li>
                        <li>Tricepsz letolás: 4x8-12</li>
                    </ul>
                </div>
                <div class="day-plan">
                    <h5>Péntek - Húzás</h5>
                    <ul>
                        <li>Húzódzkodás: 5xAMRAP</li>
                        <li>Lehúzás mellhez: 4x6-8</li>
                        <li>Döntött törzsű evezés: 4x8-10</li>
                        <li>Bicepsz hajlítás: 4x8-12</li>
                    </ul>
                </div>
                <div class="day-plan">
                    <h5>Szombat - Láb</h5>
                    <ul>
                        <li>Guggolás: 5x3-5</li>
                        <li>Lábtoló: 4x6-8</li>
                        <li>Román felhúzás: 4x6-8</li>
                        <li>Vádli: 4x10-15</li>
                    </ul>
                </div>
            </div>
        `;
  }

  planContainer.innerHTML = plan;

  // Add crimson glow to plan cards
  const planCards = planContainer.querySelectorAll(".plan-card");
  planCards.forEach((card) => {
    card.style.animation = "fadeInUp 0.5s ease";
    card.style.border = "1px solid rgba(183, 28, 28, 0.3)";
    card.style.boxShadow =
      "inset 0 1px 3px rgba(0, 0, 0, 0.5), 0 0 15px rgba(183, 28, 28, 0.2)";
  });
}

// Animate result values with crimson glow
function animateResultValues() {
  const values = [
    { id: "bmr-value", target: "1850 kcal" },
    { id: "tdee-value", target: "2550 kcal" },
    { id: "goal-value", target: "2050 kcal" },
    { id: "protein-value", target: "Fehérje: 150g" },
    { id: "fat-value", target: "Zsír: 70g" },
    { id: "carb-value", target: "Szénhidrát: 200g" },
  ];

  values.forEach((item, index) => {
    setTimeout(() => {
      const element = document.getElementById(item.id);
      if (element) {
        element.style.color = "#D32F2F";
        element.style.transform = "scale(1.1)";
        element.style.textShadow = "0 0 20px rgba(211, 47, 47, 0.5)";

        setTimeout(() => {
          element.textContent = item.target;
          element.style.color = "";
          element.style.transform = "";
          element.style.textShadow = "";
        }, 300);
      }
    }, index * 200);
  });
}

// Add food item with crimson animation
function addFoodItem(name, calories, protein, carbs, fat) {
  const foodList = document.getElementById("food-list");
  if (!foodList) return;

  const foodItem = document.createElement("div");
  foodItem.className = "food-item";
  foodItem.innerHTML = `
        <span class="food-name">${name}</span>
        <span class="food-calories">${calories} kcal</span>
        <button class="remove-food" onclick="removeFoodItem(this)">Törlés</button>
    `;

  foodItem.style.animation = "fadeInUp 0.3s ease";
  foodList.appendChild(foodItem);

  // Update totals
  updateTotals(calories, protein, carbs, fat);
  updateFoodCount();
}

// Remove food item with crimson animation
function removeFoodItem(button) {
  const foodItem = button.closest(".food-item");
  if (foodItem) {
    foodItem.style.animation = "fadeOutDown 0.3s ease";
    setTimeout(() => {
      foodItem.remove();
      updateFoodCount();
    }, 300);
  }
}

// Update totals with crimson glow
function updateTotals(calories, protein, carbs, fat) {
  const totalCalories = document.getElementById("total-calories");
  const totalProtein = document.getElementById("total-protein");
  const totalCarbs = document.getElementById("total-carbs");

  if (totalCalories) {
    const current = parseInt(totalCalories.textContent.match(/\d+/)[0]) || 0;
    const newTotal = current + calories;
    totalCalories.textContent = `Kalória: ${newTotal} kcal`;
    totalCalories.style.color = "#D32F2F";
    setTimeout(() => (totalCalories.style.color = ""), 500);
  }

  if (totalProtein) {
    const current = parseInt(totalProtein.textContent.match(/\d+/)[0]) || 0;
    const newTotal = current + protein;
    totalProtein.textContent = `Fehérje: ${newTotal} g`;
    totalProtein.style.color = "#D32F2F";
    setTimeout(() => (totalProtein.style.color = ""), 500);
  }

  if (totalCarbs) {
    const current = parseInt(totalCarbs.textContent.match(/\d+/)[0]) || 0;
    const newTotal = current + carbs;
    totalCarbs.textContent = `Szénhidrát: ${newTotal} g`;
    totalCarbs.style.color = "#D32F2F";
    setTimeout(() => (totalCarbs.style.color = ""), 500);
  }
}

// Add fadeOut animation
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeOutDown {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(20px);
        }
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.AscensionTest = {
  calculateAndGenerate,
  addFoodItem,
  removeFoodItem,
  updateTotals,
  updateFoodCount,
};
