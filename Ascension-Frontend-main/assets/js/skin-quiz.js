/* ================================
   BŐRTÍPUS KÉRDŐÍV - ARC OLDAL
================================ */

document.addEventListener("DOMContentLoaded", function () {
  const quizContainer = document.getElementById("skinQuiz");
  if (!quizContainer) return; // Csak Arc oldalon fusson

  const questionContainer = document.getElementById("questionContainer");
  const progressFill = document.getElementById("progressFill");
  const progressText = document.getElementById("progressText");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const generateBtn = document.getElementById("generateBtn");
  const routineResult = document.getElementById("routineResult");
  const dailySkinTrackerStandaloneMount = document.getElementById(
    "dailySkinTrackerStandaloneMount",
  );
  const dailySkinSaveBtn = document.getElementById("dailySkinSaveBtn");
  const SKIN_TRACKING_STORAGE_KEY = "ascension_skin_tracking_v1";
  const REQUIRED_STEPS_PER_PHASE = 3;

  let currentQuestion = 0;
  let answers = {};
  let fixedQuestionHeight = null;
  let activeTrackerController = null;
  let lastTrackerDateKey = getTodayDateKey();

  function normalizeRoutineData(routine) {
    return {
      id: routine?.id || null,
      skin_type: routine?.skin_type || "normal",
      age_group: routine?.age_group || "25_35",
      concerns: Array.isArray(routine?.concerns) ? routine.concerns : [],
      goals: Array.isArray(routine?.goals) ? routine.goals : [],
      morning_routine: Array.isArray(routine?.morning_routine)
        ? routine.morning_routine
        : [],
      evening_routine: Array.isArray(routine?.evening_routine)
        ? routine.evening_routine
        : [],
      weekly_treatments: Array.isArray(routine?.weekly_treatments)
        ? routine.weekly_treatments
        : [],
      product_recommendations: Array.isArray(routine?.product_recommendations)
        ? routine.product_recommendations
        : [],
      tips: Array.isArray(routine?.tips) ? routine.tips : [],
      created_at: routine?.created_at || null,
    };
  }

  // KÉRDÉSEK ADATBÁZIS
  const questions = [
    {
      id: "skin_type",
      question: "Milyen típusú a bőröd?",
      options: [
        { value: "normal", label: "Normál - kiegyensúlyozott, semleges" },
        { value: "dry", label: "Száraz - feszes, hámló, érzékeny" },
        { value: "oily", label: "Zsíros - fénylő, pórusos, pattanásos" },
        {
          value: "combination",
          label: "Vegyes - T-zóna zsíros, arc többi része száraz",
        },
        { value: "sensitive", label: "Érzékeny - kipirosodik, viszket, ég" },
      ],
    },
    {
      id: "age",
      question: "Hány éves vagy?",
      options: [
        { value: "under_25", label: "25 év alatt" },
        { value: "25_35", label: "25-35 év között" },
        { value: "35_45", label: "35-45 év között" },
        { value: "45_55", label: "45-55 év között" },
        { value: "over_55", label: "55 év felett" },
      ],
    },
    {
      id: "concerns",
      question: "Milyen bőrproblémákkal küzdesz? (több is lehet)",
      options: [
        { value: "acne", label: "Pattanások, mitesszerek" },
        { value: "wrinkles", label: "Ráncok, finom vonalak" },
        { value: "pigmentation", label: "Pigmentfoltok, egyenetlen bőrszín" },
        { value: "dark_circles", label: "Sötét karikák a szem alatt" },
        { value: "pores", label: "Tág pórusok" },
        { value: "none", label: "Nincs különösebb problémám" },
      ],
      multiple: true,
    },
    {
      id: "climate",
      question: "Milyen éghajlaton élsz?",
      options: [
        { value: "dry_cold", label: "Száraz, hideg éghajlat" },
        { value: "humid_hot", label: "Párás, forró éghajlat" },
        { value: "moderate", label: "Mérsékelt éghajlat" },
        { value: "changing", label: "Gyakran változó éghajlat" },
      ],
    },
    {
      id: "routine",
      question: "Jelenleg milyen gyakran ápolod a bőrödet?",
      options: [
        { value: "never", label: "Soha, nem foglalkozom vele" },
        { value: "rarely", label: "Ritkán, csak ha eszembe jut" },
        { value: "weekly", label: "Hetente párszor" },
        { value: "daily_simple", label: "Naponta, de egyszerűen" },
        { value: "daily_complete", label: "Naponta, teljes rutint" },
      ],
    },
    {
      id: "products",
      question: "Milyen termékeket használsz jelenleg?",
      options: [
        { value: "cleanser", label: "Arclemosó" },
        { value: "moisturizer", label: "Hidratáló krém" },
        { value: "sunscreen", label: "Naptej" },
        { value: "serum", label: "Szérum" },
        { value: "exfoliant", label: "Hámlasztó" },
        { value: "none", label: "Semmilyen speciális terméket" },
      ],
      multiple: true,
    },
    {
      id: "diet",
      question: "Hogyan táplálkozol?",
      options: [
        { value: "healthy", label: "Egészséges, sok zöldség, gyümölcs" },
        { value: "mixed", label: "Vegyes, próbálok odafigyelni" },
        { value: "fast_food", label: "Sok gyorskaja, feldolgozott élelmiszer" },
        { value: "vegetarian", label: "Vegetáriánus" },
        { value: "vegan", label: "Vegán" },
      ],
    },
    {
      id: "stress",
      question: "Mennyire stresszes az életed?",
      options: [
        { value: "low", label: "Alacsony, nyugodt életmód" },
        { value: "moderate", label: "Közepes, néha stresszes" },
        { value: "high", label: "Magas, folyamatos stressz" },
        { value: "very_high", label: "Nagyon magas, extrém stressz" },
      ],
    },
    {
      id: "sleep",
      question: "Mennyit alszol naponta?",
      options: [
        { value: "under_6", label: "6 óránál kevesebb" },
        { value: "6_7", label: "6-7 óra" },
        { value: "7_8", label: "7-8 óra" },
        { value: "8_9", label: "8-9 óra" },
        { value: "over_9", label: "9 óránál több" },
      ],
    },
    {
      id: "goals",
      question: "Mik a céljaid a bőröddel kapcsolatban?",
      options: [
        { value: "clear", label: "Tiszta, aknémentes bőr" },
        { value: "anti_aging", label: "Ráncok megelőzése, csökkentése" },
        { value: "hydration", label: "Jól hidratált, ragyogó bőr" },
        { value: "even_tone", label: "Egyenletes bőrszín" },
        { value: "maintenance", label: "Jelenlegi állapot megőrzése" },
      ],
      multiple: true,
    },
  ];

  function getTodayDateKey() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }

  function stripRoutineIcon(stepText) {
    return String(stepText || "")
      .replace(/[^\p{L}\p{N}\s.,:()\-+/%]/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildRequiredTrackerSteps(routine) {
    const morningSteps = (
      Array.isArray(routine?.morning_routine) ? routine.morning_routine : []
    )
      .map((step) => stripRoutineIcon(step))
      .filter(Boolean)
      .slice(0, REQUIRED_STEPS_PER_PHASE)
      .map((label, index) => ({
        id: `morning-${index}-${label.toLowerCase().replace(/\s+/g, "-")}`,
        phase: "morning",
        label,
      }));

    const eveningSteps = (
      Array.isArray(routine?.evening_routine) ? routine.evening_routine : []
    )
      .map((step) => stripRoutineIcon(step))
      .filter(Boolean)
      .slice(0, REQUIRED_STEPS_PER_PHASE)
      .map((label, index) => ({
        id: `evening-${index}-${label.toLowerCase().replace(/\s+/g, "-")}`,
        phase: "evening",
        label,
      }));

    return [...morningSteps, ...eveningSteps];
  }

  function getRoutineTrackingSignature(requiredSteps) {
    return requiredSteps.map((step) => `${step.phase}:${step.label}`).join("|");
  }

  function loadSkinTrackingMap() {
    try {
      const raw = localStorage.getItem(SKIN_TRACKING_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function saveSkinTrackingEntry(entry) {
    const map = loadSkinTrackingMap();
    map[entry.date] = entry;
    localStorage.setItem(SKIN_TRACKING_STORAGE_KEY, JSON.stringify(map));
  }

  function getSkinTrackingEntry(dateKey) {
    const map = loadSkinTrackingMap();
    return map[dateKey] || null;
  }

  function calculateTrackerMetrics(state) {
    const requiredCount = state.requiredSteps.length;
    const completedCount = state.completedStepIds.filter((stepId) =>
      state.requiredSteps.some((step) => step.id === stepId),
    ).length;

    const morningRequired = state.requiredSteps.filter(
      (step) => step.phase === "morning",
    );
    const eveningRequired = state.requiredSteps.filter(
      (step) => step.phase === "evening",
    );

    const morningCompleted = morningRequired.filter((step) =>
      state.completedStepIds.includes(step.id),
    );
    const eveningCompleted = eveningRequired.filter((step) =>
      state.completedStepIds.includes(step.id),
    );

    const percent =
      requiredCount > 0
        ? Math.min(100, Math.round((completedCount / requiredCount) * 100))
        : 0;

    return {
      requiredCount,
      completedCount,
      percent,
      morningRequiredCount: morningRequired.length,
      eveningRequiredCount: eveningRequired.length,
      morningCompletedCount: morningCompleted.length,
      eveningCompletedCount: eveningCompleted.length,
      morningCompletedLabels: morningCompleted.map((step) => step.label),
      eveningCompletedLabels: eveningCompleted.map((step) => step.label),
    };
  }

  async function syncTrackerToBackend(state, metrics) {
    const token = localStorage.getItem("authToken");
    if (!token || !state.routineId) return;

    try {
      const response = await fetch("http://localhost:3000/api/skin/tracking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          routine_id: state.routineId,
          date: state.date,
          morning_completed:
            metrics.morningRequiredCount > 0 &&
            metrics.morningCompletedCount >= metrics.morningRequiredCount,
          evening_completed:
            metrics.eveningRequiredCount > 0 &&
            metrics.eveningCompletedCount >= metrics.eveningRequiredCount,
          morning_steps: metrics.morningCompletedLabels,
          evening_steps: metrics.eveningCompletedLabels,
          notes: "Arc tracker automatikus mentés",
        }),
      });

      const data = await response.json();
      if (!data.success) {
        console.warn("Skin tracking backend mentés sikertelen:", data.error);
      }
    } catch (error) {
      console.warn("Skin tracking backend mentési hiba:", error);
    }
  }

  async function mergeTrackerFromBackend(state) {
    const token = localStorage.getItem("authToken");
    if (!token || !state.routineId) return state;

    try {
      const response = await fetch(
        `http://localhost:3000/api/skin/tracking?routine_id=${encodeURIComponent(state.routineId)}&date=${encodeURIComponent(state.date)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const data = await response.json();
      if (!data.success || !data.tracking) return state;

      const backendLabels = [
        ...(Array.isArray(data.tracking.morning_steps)
          ? data.tracking.morning_steps
          : []),
        ...(Array.isArray(data.tracking.evening_steps)
          ? data.tracking.evening_steps
          : []),
      ];

      if (backendLabels.length === 0) return state;

      const backendIds = state.requiredSteps
        .filter((step) => backendLabels.includes(step.label))
        .map((step) => step.id);

      if (backendIds.length > 0) {
        state.completedStepIds = Array.from(new Set(backendIds));
      }

      return state;
    } catch (error) {
      console.warn("Skin tracking backend betöltési hiba:", error);
      return state;
    }
  }

  function buildTrackerHTML(state) {
    const metrics = calculateTrackerMetrics(state);

    if (metrics.requiredCount === 0) {
      return {
        html: `
          <div class="daily-skin-tracker empty">
            <h4>Napi Arc Cél</h4>
            <p>A napi követéshez előbb ments egy rutint.</p>
          </div>
        `,
        metrics,
      };
    }

    const itemsHtml = state.requiredSteps
      .map((step) => {
        const checked = state.completedStepIds.includes(step.id);
        const phaseLabel = step.phase === "morning" ? "Reggel" : "Este";
        return `
          <label class="daily-skin-item ${checked ? "done" : ""}">
            <input type="checkbox" data-step-id="${step.id}" ${checked ? "checked" : ""} />
            <span class="daily-skin-phase">${phaseLabel}</span>
            <span class="daily-skin-text">${step.label}</span>
          </label>
        `;
      })
      .join("");

    return {
      html: `
        <div class="daily-skin-tracker">
          <div class="daily-skin-head">
            <h4>Napi Arc Cél</h4>
            <p>${metrics.completedCount}/${metrics.requiredCount} lépés • ${metrics.percent}%</p>
          </div>
          <div class="daily-skin-progress">
            <span style="width: ${metrics.percent}%;"></span>
          </div>
          <div class="daily-skin-list">
            ${itemsHtml}
          </div>
        </div>
      `,
      metrics,
    };
  }

  async function initDailySkinTracker(routine, mount) {
    if (!mount) return null;

    const today = getTodayDateKey();
    const requiredSteps = buildRequiredTrackerSteps(routine);
    const signature = getRoutineTrackingSignature(requiredSteps);
    const localEntry = getSkinTrackingEntry(today);
    const localCompletedIds =
      localEntry && localEntry.signature === signature
        ? Array.isArray(localEntry.completedStepIds)
          ? localEntry.completedStepIds
          : []
        : [];

    const state = {
      date: today,
      routineId:
        Number(routine?.id || localStorage.getItem("currentRoutineId")) || null,
      requiredSteps,
      signature,
      completedStepIds: localCompletedIds.filter((stepId) =>
        requiredSteps.some((step) => step.id === stepId),
      ),
    };

    const mergedState = await mergeTrackerFromBackend(state);

    const persistState = async ({ syncBackend = false } = {}) => {
      const metrics = calculateTrackerMetrics(mergedState);
      saveSkinTrackingEntry({
        date: mergedState.date,
        routineId: mergedState.routineId,
        signature: mergedState.signature,
        completedStepIds: mergedState.completedStepIds,
        percent: metrics.percent,
        completedCount: metrics.completedCount,
        requiredCount: metrics.requiredCount,
        updatedAt: new Date().toISOString(),
      });

      if (syncBackend) {
        await syncTrackerToBackend(mergedState, metrics);
      }

      return metrics;
    };

    const renderTracker = () => {
      const built = buildTrackerHTML(mergedState);
      mount.innerHTML = built.html;

      const checkboxes = mount.querySelectorAll(
        "input[type='checkbox'][data-step-id]",
      );
      checkboxes.forEach((input) => {
        input.addEventListener("change", async () => {
          const stepId = input.dataset.stepId;
          if (!stepId) return;

          if (input.checked) {
            if (!mergedState.completedStepIds.includes(stepId)) {
              mergedState.completedStepIds.push(stepId);
            }
          } else {
            mergedState.completedStepIds = mergedState.completedStepIds.filter(
              (id) => id !== stepId,
            );
          }

          await persistState();
          renderTracker();
        });
      });
    };

    await persistState();
    renderTracker();

    return {
      save: ({ syncBackend = true } = {}) =>
        persistState({ syncBackend }).then((metrics) => ({
          metrics,
          state: mergedState,
        })),
      getMetrics: () => calculateTrackerMetrics(mergedState),
    };
  }

  async function renderStandaloneTracker(routine) {
    if (!dailySkinTrackerStandaloneMount) return;

    if (!routine) {
      dailySkinTrackerStandaloneMount.innerHTML = `
        <div class="daily-skin-tracker empty">
          <h4>Napi Arc Cél</h4>
          <p>Először készíts vagy tölts be egy rutint, utána itt tudod követni a napi lépéseket.</p>
        </div>
      `;
      activeTrackerController = null;
      if (dailySkinSaveBtn) {
        dailySkinSaveBtn.disabled = true;
      }
      return;
    }

    const controller = await initDailySkinTracker(
      routine,
      dailySkinTrackerStandaloneMount,
    );
    activeTrackerController = controller;
    if (dailySkinSaveBtn) {
      dailySkinSaveBtn.disabled = !controller;
    }
  }

  function buildOptionsHTML(question) {
    let optionsHTML = "";
    if (question.multiple) {
      optionsHTML = question.options
        .map((option, index) => {
          const isChecked =
            answers[question.id] && answers[question.id].includes(option.value);
          return `
                    <label class="quiz-option">
                        <input type="checkbox" name="${question.id}" value="${option.value}" 
                               ${isChecked ? "checked" : ""} data-index="${index}">
                        <span class="option-text">${option.label}</span>
                    </label>
                `;
        })
        .join("");
    } else {
      optionsHTML = question.options
        .map((option, index) => {
          const isChecked = answers[question.id] === option.value;
          return `
                    <label class="quiz-option">
                        <input type="radio" name="${question.id}" value="${option.value}" 
                               ${isChecked ? "checked" : ""} data-index="${index}">
                        <span class="option-text">${option.label}</span>
                    </label>
                `;
        })
        .join("");
    }

    return optionsHTML;
  }

  function renderQuestionHTML(question) {
    return `
            <div class="question-content">
                <h4 class="question-title">${question.question}</h4>
                <div class="options-container">
                    ${buildOptionsHTML(question)}
                </div>
            </div>
        `;
  }

  function calculateFixedQuestionHeight() {
    const widthSource =
      questionContainer.clientWidth || quizContainer.clientWidth || 720;
    const probe = document.createElement("div");
    probe.style.position = "absolute";
    probe.style.left = "-9999px";
    probe.style.top = "0";
    probe.style.visibility = "hidden";
    probe.style.pointerEvents = "none";
    probe.style.width = `${Math.max(320, widthSource)}px`;
    probe.className = "quiz-question";
    document.body.appendChild(probe);

    let maxHeight = 0;
    questions.forEach((question) => {
      probe.innerHTML = renderQuestionHTML(question);
      maxHeight = Math.max(maxHeight, probe.scrollHeight);
    });

    document.body.removeChild(probe);

    fixedQuestionHeight = Math.ceil(maxHeight + 2);
  }

  function applyQuestionContainerFixedHeight() {
    if (!fixedQuestionHeight) return;
    questionContainer.style.height = `${fixedQuestionHeight}px`;
    questionContainer.style.minHeight = `${fixedQuestionHeight}px`;
  }

  function clearQuestionContainerFixedHeight() {
    questionContainer.style.height = "auto";
    questionContainer.style.minHeight = "0";
  }

  // KEZDETI BETÖLTÉS
  function loadQuestion() {
    const question = questions[currentQuestion];
    const isLast = currentQuestion === questions.length - 1;

    // Progress frissítése
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${currentQuestion + 1} / ${questions.length}`;

    // Gombok állapotának frissítése
    prevBtn.style.display = currentQuestion === 0 ? "none" : "inline-block";
    nextBtn.style.display = isLast ? "none" : "inline-block";
    generateBtn.style.display = isLast ? "inline-block" : "none";

    // Kérdés HTML generálása
    questionContainer.innerHTML = renderQuestionHTML(question);

    applyQuestionContainerFixedHeight();

    // Event listener-ek hozzáadása
    const inputs = questionContainer.querySelectorAll("input");
    inputs.forEach((input) => {
      input.addEventListener("change", saveAnswer);
    });
  }

  // VÁLASZ MENTÉSE
  function saveAnswer() {
    const question = questions[currentQuestion];
    const inputs = questionContainer.querySelectorAll(
      `input[name="${question.id}"]`,
    );

    if (question.multiple) {
      const checkedValues = Array.from(inputs)
        .filter((input) => input.checked)
        .map((input) => input.value);
      answers[question.id] = checkedValues;
    } else {
      const checkedInput = Array.from(inputs).find((input) => input.checked);
      if (checkedInput) {
        answers[question.id] = checkedInput.value;
      }
    }
  }

  // KÖVETKEZŐ KÉRDÉS
  function nextQuestion() {
    if (currentQuestion < questions.length - 1) {
      currentQuestion++;
      loadQuestion();
    }
  }

  // ELŐZŐ KÉRDÉS
  function prevQuestion() {
    if (currentQuestion > 0) {
      currentQuestion--;
      loadQuestion();
    }
  }

  // RUTIN GENERÁLÁSA
  async function generateRoutine() {
    try {
      // Mentjük a válaszokat
      localStorage.setItem("skinQuizAnswers", JSON.stringify(answers));

      // Kliens oldali generálás az aktuális válaszokból
      const routine = generateClientSideRoutine();
      displayRoutine(routine);
    } catch (error) {
      console.error("Rutin generálási hiba:", error);
      // Kliens oldali generálás hiba esetén
      const routine = generateClientSideRoutine();
      displayRoutine(routine);
    }
  }

  // KLIENS OLDALI RUTIN GENERÁLÁS
  function generateClientSideRoutine() {
    const skinType = answers.skin_type || "normal";
    const age = answers.age || "25_35";
    const concerns = answers.concerns || [];
    const goals = answers.goals || [];

    let routine = {
      skin_type: skinType,
      age_group: age,
      concerns: concerns,
      morning_routine: [],
      evening_routine: [],
      weekly_treatments: [],
      product_recommendations: [],
      tips: [],
    };

    // Reggeli rutin generálása
    routine.morning_routine = [
      "🌅 Arclemosás (langyos víz)",
      "💧 Tonizálás",
      "🧴 Hidratáló krém",
      "☀️ Naptej (SPF 30+)",
    ];

    // Esti rutin generálása
    routine.evening_routine = [
      "🌙 Sminklemelés (ha van)",
      "🧼 Mélytisztítás",
      "💡 Szérum (problémák szerint)",
      "🌙 Éjszakai krém",
    ];

    // Speciális kezelések
    if (concerns.includes("acne")) {
      routine.weekly_treatments.push("🧪 Heti 1x BHA hámlasztás");
      routine.product_recommendations.push("Szalicilsavas toner");
    }

    if (concerns.includes("wrinkles")) {
      routine.weekly_treatments.push("⏰ Retinol bevezetése");
      routine.product_recommendations.push("Retinol szérum");
    }

    // Bőrtípus specifikus tanácsok
    if (skinType === "dry") {
      routine.tips.push("💧 Igyál sok vizet!");
      routine.tips.push("🧴 Használj hidratáló maszkokat");
    } else if (skinType === "oily") {
      routine.tips.push("🧻 Kerüld a túlzásos tisztítást");
      routine.tips.push("🌿 Használj olajmentes termékeket");
    }

    return routine;
  }

  // RUTIN MEGJELENÍTÉSE
  function displayRoutine(routine) {
    const normalizedRoutine = normalizeRoutineData(routine);

    clearQuestionContainerFixedHeight();
    quizContainer.style.display = "none";
    routineResult.style.display = "block";

    // Elmentjük a generált rutint localStorage-ba
    localStorage.setItem(
      "lastGeneratedRoutine",
      JSON.stringify(normalizedRoutine),
    );
    if (normalizedRoutine.id) {
      localStorage.setItem("currentRoutineId", String(normalizedRoutine.id));
    }

    localStorage.setItem(
      "skinQuizAnswers",
      JSON.stringify({
        skin_type: normalizedRoutine.skin_type,
        age: normalizedRoutine.age_group,
        concerns: normalizedRoutine.concerns,
        goals: normalizedRoutine.goals,
      }),
    );

    routineResult.innerHTML = `
            <div class="routine-header">
                <h3>Személyre Szabott Arcápolási Rutin</h3>
          <p>Bőrtípusod: <strong>${getSkinTypeLabel(normalizedRoutine.skin_type)}</strong></p>
            </div>

            <div class="routine-section">
                <h4>Reggeli Rutin</h4>
                <ul class="routine-steps">
            ${normalizedRoutine.morning_routine.map((step) => `<li>${step.replace(/🌅|💧|🧴|☀️/g, "").trim()}</li>`).join("")}
                </ul>
            </div>

            <div class="routine-section">
                <h4>Esti Rutin</h4>
                <ul class="routine-steps">
            ${normalizedRoutine.evening_routine.map((step) => `<li>${step.replace(/🌙|🧼|💡|🌾/g, "").trim()}</li>`).join("")}
                </ul>
            </div>

            ${
              normalizedRoutine.weekly_treatments.length > 0
                ? `
            <div class="routine-section">
                <h4>Heti Kezelések</h4>
                <ul class="routine-steps">
            ${normalizedRoutine.weekly_treatments.map((treatment) => `<li>${treatment.replace(/🧪|⏰/g, "").trim()}</li>`).join("")}
                </ul>
            </div>
            `
                : ""
            }

            ${
              normalizedRoutine.product_recommendations.length > 0
                ? `
            <div class="routine-section">
                <h4>Termék Ajánlások</h4>
                <ul class="routine-steps">
            ${normalizedRoutine.product_recommendations.map((product) => `<li>${product}</li>`).join("")}
                </ul>
            </div>
            `
                : ""
            }

            ${
              normalizedRoutine.tips.length > 0
                ? `
            <div class="routine-section">
                <h4>További Tanácsok</h4>
                <ul class="routine-tips">
            ${normalizedRoutine.tips.map((tip) => `<li>${tip.replace(/💧|🧴|🌿/g, "").trim()}</li>`).join("")}
                </ul>
            </div>
            `
                : ""
            }

            <div class="routine-actions">
                <button class="btn-quiz btn-primary" onclick="saveRoutine()">Rutin Mentése</button>
                <button class="btn-quiz" onclick="resetQuiz()">Új Kérdőív</button>
            </div>
        `;

    renderStandaloneTracker(normalizedRoutine);
  }

  async function loadExistingRoutineIfAvailable() {
    const token = localStorage.getItem("authToken");

    if (token) {
      try {
        const response = await fetch("http://localhost:3000/api/skin/routine", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success && data.routine) {
          displayRoutine(data.routine);
          return true;
        }
      } catch (error) {
        console.warn("Mentett rutin lekérése sikertelen:", error);
      }
    }

    try {
      const localRoutineRaw = localStorage.getItem("lastGeneratedRoutine");
      if (!localRoutineRaw) return false;
      const localRoutine = JSON.parse(localRoutineRaw);
      if (!localRoutine || typeof localRoutine !== "object") return false;
      displayRoutine(localRoutine);
      return true;
    } catch {
      return false;
    }
  }

  function getStoredRoutineForDailyTracker() {
    try {
      const localRoutineRaw = localStorage.getItem("lastGeneratedRoutine");
      if (!localRoutineRaw) return null;
      const parsed = JSON.parse(localRoutineRaw);
      if (!parsed || typeof parsed !== "object") return null;
      return normalizeRoutineData(parsed);
    } catch {
      return null;
    }
  }

  async function handleTrackerDateRollover() {
    const nowDateKey = getTodayDateKey();
    if (nowDateKey === lastTrackerDateKey) return;

    lastTrackerDateKey = nowDateKey;
    const routine = getStoredRoutineForDailyTracker();
    await renderStandaloneTracker(routine);
  }

  // Bőrtípus label getter
  function getSkinTypeLabel(skinType) {
    const labels = {
      normal: "Normál",
      dry: "Száraz",
      oily: "Zsíros",
      combination: "Vegyes",
      sensitive: "Érzékeny",
    };
    return labels[skinType] || skinType;
  }

  // RUTIN MENTÉSE
  window.saveRoutine = async function () {
    try {
      // Ellenőrizzük, hogy be van-e jelentkezve a felhasználó
      const token = localStorage.getItem("authToken");
      if (!token) {
        alert("A rutin mentéséhez be kell jelentkezned!");
        return;
      }

      const answers = JSON.parse(
        localStorage.getItem("skinQuizAnswers") || "{}",
      );
      const routine = JSON.parse(
        localStorage.getItem("lastGeneratedRoutine") || "{}",
      );
      const normalizedRoutine = normalizeRoutineData(routine);

      // Ellenőrizzük, hogy vannak-e adatok
      if (!answers.skin_type || Object.keys(normalizedRoutine).length === 0) {
        alert("Nincs elég adat a mentéshez! Kérlek, töltsd ki a kérdőívet.");
        return;
      }

      console.log("📤 Rutin mentése:", { answers, routine: normalizedRoutine });

      const response = await fetch(
        "http://localhost:3000/api/skin/save-routine",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            answers: answers,
            routine: normalizedRoutine,
          }),
        },
      );

      console.log("📨 Válasz státusz:", response.status);
      console.log("📨 Válasz headers:", response.headers);

      // Ellenőrizzük a válasz típusát
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Nem JSON válasz:", text);
        alert(
          "Szerver hiba: A backend nem JSON választ adott. Ellenőrizd a backend konzolt!",
        );
        return;
      }

      const data = await response.json();
      console.log("✅ Válasz adatok:", data);

      if (data.success) {
        if (data.unchanged) {
          alert("Nincs változás a rutinban.");
        } else if (data.updated) {
          alert("Rutin frissítve! ID: " + data.routine_id);
        } else {
          alert("Rutin sikeresen elmentve! ID: " + data.routine_id);
        }

        // Elmentjük a rutin ID-t is
        localStorage.setItem("currentRoutineId", data.routine_id);
        normalizedRoutine.id = data.routine_id;
        localStorage.setItem(
          "lastGeneratedRoutine",
          JSON.stringify(normalizedRoutine),
        );
        displayRoutine(normalizedRoutine);
      } else {
        alert("Hiba a mentés során: " + data.error);
      }
    } catch (error) {
      console.error("Rutin mentési hiba:", error);
      alert("Hiba a mentés során: " + error.message);
    }
  };

  // KÉRDŐÍV VISSZAÁLLÍTÁSA
  window.resetQuiz = function () {
    currentQuestion = 0;
    answers = {};
    quizContainer.style.display = "block";
    routineResult.style.display = "none";
    calculateFixedQuestionHeight();
    loadQuestion();
  };

  // EVENT LISTENEREK
  nextBtn.addEventListener("click", nextQuestion);
  prevBtn.addEventListener("click", prevQuestion);
  generateBtn.addEventListener("click", generateRoutine);
  if (dailySkinSaveBtn) {
    dailySkinSaveBtn.addEventListener("click", async () => {
      if (!activeTrackerController) {
        alert(
          "Nincs menthető napi arc követés. Előbb legyen elmentett rutinod.",
        );
        return;
      }

      const result = await activeTrackerController.save({ syncBackend: true });
      const { metrics } = result;
      alert(
        `Napi arc követés mentve! ${metrics.completedCount}/${metrics.requiredCount} lépés (${metrics.percent}%).`,
      );
    });
  }

  // KEZDETI BETÖLTÉS
  calculateFixedQuestionHeight();

  (async () => {
    const hasExistingRoutine = await loadExistingRoutineIfAvailable();
    if (!hasExistingRoutine) {
      await renderStandaloneTracker(null);
      loadQuestion();
    }
  })();

  setInterval(() => {
    handleTrackerDateRollover();
  }, 30000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      handleTrackerDateRollover();
    }
  });

  window.addEventListener("resize", () => {
    if (quizContainer.style.display === "none") return;
    calculateFixedQuestionHeight();
    loadQuestion();
  });
});
