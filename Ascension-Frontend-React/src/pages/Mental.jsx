import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProfileModal from "../components/ProfileModal";
import { useAlert } from "../components/AlertContext";
import "./Mental.css";

const MENTAL_SAVE_ROUTINE_API_URL =
  "http://localhost:3000/api/mental/save-routine";
const MENTAL_ROUTINE_API_URL = "http://localhost:3000/api/mental/routine";
const MENTAL_TRACKING_API_URL = "http://localhost:3000/api/mental/tracking";

const MENTAL_QUESTIONS = [
  {
    id: "primaryGoal",
    question: "Mi a fókuszod most?",
    options: [
      { value: "discipline", label: "Fegyelem és szokásépítés" },
      { value: "focus", label: "Koncentráció és produktivitás" },
      { value: "stress", label: "Stresszcsökkentés" },
      { value: "confidence", label: "Önbizalom és stabilitás" },
    ],
  },
  {
    id: "dailyTime",
    question: "Mennyi időt tudsz biztosan szánni mentális fejlődésre naponta?",
    options: [
      { value: "5", label: "5 perc" },
      { value: "10", label: "10 perc" },
      { value: "20", label: "20 perc" },
      { value: "30", label: "30+ perc" },
    ],
  },
  {
    id: "readingHabit",
    question: "Milyen gyakran olvasol önfejlesztő könyvet?",
    options: [
      { value: "never", label: "Szinte soha" },
      { value: "rare", label: "Ritkán" },
      { value: "sometimes", label: "Hetente néhányszor" },
      { value: "daily", label: "Minden nap" },
    ],
  },
  {
    id: "stressLevel",
    question: "Milyen volt az elmúlt hetek stressz-szintje?",
    options: [
      { value: "very_low", label: "Nagyon alacsony" },
      { value: "low", label: "Alacsony" },
      { value: "mid", label: "Közepes" },
      { value: "high", label: "Magas" },
    ],
  },
  {
    id: "sleepQuality",
    question: "Milyen az alvásod minősége mostanában?",
    options: [
      { value: "poor", label: "Gyenge, gyakran megszakad" },
      { value: "mixed", label: "Változó" },
      { value: "good", label: "Jó" },
      { value: "excellent", label: "Nagyon jó, pihentető" },
    ],
  },
];

const MOTIVATIONAL_QUOTES = [
  "A siker nem véletlenszerű. Rendszer kérdése.",
  "Nem a motiváció visz előre, hanem a fegyelem.",
  "Minden nap egy lehetőség, hogy jobbá válj, mint tegnap voltál.",
  "A kiválóság útja apró, következetes lépésekből áll.",
  "Aki vár a tökéletes pillanatra, az örökké vár.",
  "Az igazi győzelem önmagad felett aratott.",
  "Ne az legyen a kérdés, hogy képes vagy-e rá. Hanem az, hogy meg fogod-e tenni.",
  "A kényelemzóna széle ott kezdődik, ahol a fejlődés.",
  "A tudatosság az első lépés a változás felé.",
  "Nem az számít, honnan indulsz, hanem hová tartasz.",
  "A felelősség átvétele erőt ad. A kifogások gyengítenek.",
  "Az elméd a te edzőtermed. Eddzd, formáld, fejleszd.",
  "Amit ma megteszel, holnap köszönni fogod magadnak.",
  "A változás nem holnap kezdődik. Most.",
  "Az önfejlesztés sosem ér véget. Ez az út maga a cél.",
  "A mentális erő fontosabb, mint a fizikai.",
  "Nem attól leszel erős, hogy soha nem esel el, hanem attól, ahogy felállsz.",
  "A tiszta gondolatok tiszta életet hoznak.",
  "A kitartás legyőzi a tehetséget, ha a tehetség nem dolgozik.",
  "Minden nagy utazás egyetlen lépéssel kezdődik.",
];

function getRandomQuote(exclude = "") {
  if (MOTIVATIONAL_QUOTES.length === 1) return MOTIVATIONAL_QUOTES[0];

  let next = exclude;
  while (next === exclude) {
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    next = MOTIVATIONAL_QUOTES[randomIndex];
  }
  return next;
}

function getTodayStr() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function buildMentalRoutine(answers) {
  const tasks = [
    { id: "read10", label: "Olvass 10 oldal könyvet" },
    {
      id: "offline30",
      label: "30 perc fókuszblokk értesítések és social media nélkül",
    },
    {
      id: "water",
      label: "Igyál meg legalább 2 pohár vizet tudatos szünetként",
    },
    { id: "wins", label: "Írj fel 2 dolgot, amit ma jól csináltál" },
  ];

  if (answers.primaryGoal === "focus") {
    tasks.push({ id: "deepWork", label: "1 blokk fókuszmunka (25 perc)" });
    tasks.push({ id: "priorities", label: "Írj 3 konkrét napi prioritást" });
  }

  if (answers.primaryGoal === "confidence") {
    tasks.push({ id: "selfTalk", label: "Mondd ki hangosan 3 erősségedet" });
  }

  if (answers.primaryGoal === "stress" || answers.stressLevel === "high") {
    tasks.push({ id: "breath", label: "5 perc légzőgyakorlat" });
    tasks.push({ id: "journal", label: "Rövid esti napló (3 mondat)" });
  } else {
    tasks.push({
      id: "walk20",
      label: "20 perc tempós séta vagy könnyű mozgás",
    });
  }

  if (answers.dailyTime === "5") {
    tasks.push({
      id: "microReset",
      label: "2 perc csendszünet, mély levegőkkel",
    });
  }

  if (answers.dailyTime === "20") {
    tasks.push({
      id: "review",
      label: "10 perc napi visszatekintés: mi vitt előre?",
    });
  }

  if (answers.dailyTime === "30") {
    tasks.push({ id: "reflect", label: "Napi önreflexió: mi ment jól ma?" });
    tasks.push({
      id: "planTomorrow",
      label: "Írd le a holnapi nap 3 fő fókuszpontját",
    });
  }

  if (answers.readingHabit === "never" || answers.readingHabit === "rare") {
    tasks.push({
      id: "bookPrep",
      label: "Készíts ki estére egy könyvet előre",
    });
  }

  if (answers.sleepQuality === "poor" || answers.sleepQuality === "mixed") {
    tasks.push({
      id: "sleepPrep",
      label: "Alvás előtt 30 perccel kapcsold ki a képernyőt",
    });
  }

  const uniqueTasks = [];
  const seen = new Set();
  tasks.forEach((task) => {
    if (seen.has(task.id)) return;
    seen.add(task.id);
    uniqueTasks.push(task);
  });

  return uniqueTasks.slice(0, 8);
}

export default function Mental() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [quote, setQuote] = useState("");
  const [quoteVisible, setQuoteVisible] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [routineId, setRoutineId] = useState(null);
  const [routineTasks, setRoutineTasks] = useState([]);
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [savingCompletion, setSavingCompletion] = useState(false);

  const authHeaders = (() => {
    const token = localStorage.getItem("authToken");
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  })();

  useEffect(() => {
    document.title = "Ascension - Mentál";
  }, []);

  useEffect(() => {
    setQuote(getRandomQuote());
    setQuoteVisible(true);
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      try {
        const token = localStorage.getItem("authToken");
        const rawUser = localStorage.getItem("user");

        if (!token || !rawUser) {
          setUser(null);
          return;
        }

        setUser(JSON.parse(rawUser));
      } catch {
        setUser(null);
      }
    };

    syncAuth();
    window.addEventListener("focus", syncAuth);
    window.addEventListener("storage", syncAuth);

    return () => {
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("storage", syncAuth);
    };
  }, []);

  useEffect(() => {
    if (!authHeaders) {
      setRoutineId(null);
      setRoutineTasks([]);
      setCompletedTaskIds([]);
      return;
    }

    const loadRoutine = async () => {
      try {
        const response = await fetch(MENTAL_ROUTINE_API_URL, {
          method: "GET",
          headers: authHeaders,
        });
        const data = await response.json();

        if (!response.ok || !data.success || !data.routine) {
          setRoutineId(null);
          setRoutineTasks([]);
          setCompletedTaskIds([]);
          setCurrentQuestionIndex(0);
          return;
        }

        const nextTasks = Array.isArray(data.routine.tasks)
          ? data.routine.tasks
          : [];
        setRoutineId(data.routine.id ?? null);
        setRoutineTasks(nextTasks);
        setQuizAnswers(data.routine.answers || {});
        setCurrentQuestionIndex(MENTAL_QUESTIONS.length);
      } catch {
        setRoutineId(null);
        setRoutineTasks([]);
        setCompletedTaskIds([]);
      }
    };

    loadRoutine();
  }, [authHeaders?.Authorization]);

  useEffect(() => {
    if (!authHeaders || routineId == null) {
      setCompletedTaskIds([]);
      return;
    }

    const loadTracking = async () => {
      try {
        const today = getTodayStr();
        const response = await fetch(
          `${MENTAL_TRACKING_API_URL}?routine_id=${encodeURIComponent(
            routineId,
          )}&date=${encodeURIComponent(today)}`,
          {
            method: "GET",
            headers: authHeaders,
          },
        );
        const data = await response.json();

        if (!response.ok || !data.success || !data.tracking) {
          setCompletedTaskIds([]);
          return;
        }

        const ids = Array.isArray(data.tracking.completed_task_ids)
          ? data.tracking.completed_task_ids
          : [];

        setCompletedTaskIds(
          ids.filter((taskId) =>
            routineTasks.some((task) => task.id === taskId),
          ),
        );
      } catch {
        setCompletedTaskIds([]);
      }
    };

    loadTracking();
  }, [authHeaders?.Authorization, routineId, routineTasks]);

  const currentQuestion = MENTAL_QUESTIONS[currentQuestionIndex];
  const isQuizCompleted = currentQuestionIndex >= MENTAL_QUESTIONS.length;
  const progressPercent = Math.round(
    (Math.min(currentQuestionIndex, MENTAL_QUESTIONS.length) /
      MENTAL_QUESTIONS.length) *
      100,
  );

  const completionPercent =
    routineTasks.length > 0
      ? Math.round((completedTaskIds.length / routineTasks.length) * 100)
      : 0;

  const handleRefreshQuote = () => {
    setQuoteVisible(false);

    window.setTimeout(() => {
      setQuote(getRandomQuote(quote));
      setQuoteVisible(true);
    }, 120);
  };

  const handleAnswer = async (questionId, value) => {
    const nextAnswers = {
      ...quizAnswers,
      [questionId]: value,
    };

    setQuizAnswers(nextAnswers);

    const isLastQuestion = currentQuestionIndex === MENTAL_QUESTIONS.length - 1;
    if (!isLastQuestion) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    const nextRoutine = buildMentalRoutine(nextAnswers);
    setRoutineTasks(nextRoutine);
    setCurrentQuestionIndex(MENTAL_QUESTIONS.length);
    setCompletedTaskIds([]);

    if (!authHeaders) {
      await showAlert("A mentális rutin mentéséhez jelentkezz be.");
      return;
    }

    try {
      const response = await fetch(MENTAL_SAVE_ROUTINE_API_URL, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          answers: nextAnswers,
          routineTasks: nextRoutine,
        }),
      });
      const raw = await response.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        await showAlert(
          data.error ||
            "Nem sikerült menteni a mentális rutint. Ellenőrizd, hogy a backend fut és friss.",
        );
        return;
      }

      setRoutineId(data.routine_id || null);
    } catch {
      await showAlert("Hálózati hiba történt a mentális rutin mentése közben.");
    }
  };

  const toggleTask = (taskId) => {
    const nextCompleted = completedTaskIds.includes(taskId)
      ? completedTaskIds.filter((id) => id !== taskId)
      : [...completedTaskIds, taskId];

    setCompletedTaskIds(nextCompleted);
  };

  const restartMentalPlan = () => {
    setCurrentQuestionIndex(0);
    setQuizAnswers({});
    setRoutineId(null);
    setRoutineTasks([]);
    setCompletedTaskIds([]);
  };

  const handleSaveCompletion = async () => {
    if (!routineTasks.length) {
      await showAlert("Nincs menthető napi mentál teljesítés.");
      return;
    }

    if (!authHeaders || routineId == null) {
      await showAlert(
        "A napi mentál követés mentéséhez legyen mentett rutinod és bejelentkezésed.",
      );
      return;
    }

    setSavingCompletion(true);
    try {
      const today = getTodayStr();
      const response = await fetch(MENTAL_TRACKING_API_URL, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          routine_id: routineId,
          date: today,
          completed_task_ids: completedTaskIds,
          completed_count: completedTaskIds.length,
          required_count: routineTasks.length,
          percent: completionPercent,
          notes: "Mentál tracker mentés",
        }),
      });

      const raw = await response.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        await showAlert(
          data.error || "Nem sikerült menteni a napi mentál követést.",
        );
        return;
      }

      if (completionPercent === 100) {
        await showAlert(
          `Napi mentál követés mentve! ${completedTaskIds.length}/${routineTasks.length} feladat (${completionPercent}%). Tökéletes teljesítés!`,
        );
      } else {
        await showAlert(
          `Napi mentál követés mentve! ${completedTaskIds.length}/${routineTasks.length} feladat (${completionPercent}%).`,
        );
      }

      window.dispatchEvent(new Event("focus"));
    } catch {
      await showAlert("Hiba történt a napi mentál követés mentése során.");
    } finally {
      setSavingCompletion(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsProfileOpen(false);
    navigate("/");
  };

  return (
    <div className="mental-page">
      <Navbar onOpenProfile={() => setIsProfileOpen(true)} user={user} />

      <main className="mental-content">
        <section className="mental-hero">
          <h1 className="mental-title">Mentál</h1>

          <p className="mental-lead">
            Napi mentális fókusz. Kicsi lépések, stabil fejlődés.
          </p>
        </section>

        <section className="mental-routine-section">
          <div className="mental-routine-head">
            <h3>🧠 Mentális rutin</h3>
            {routineTasks.length > 0 && (
              <button
                type="button"
                className="btn-mental-reset"
                onClick={restartMentalPlan}
              >
                Újratervezés
              </button>
            )}
          </div>

          {!isQuizCompleted && currentQuestion ? (
            <div className="mental-quiz-card">
              <p className="mental-quiz-progress">
                Kérdés {currentQuestionIndex + 1} / {MENTAL_QUESTIONS.length}
              </p>
              <div className="mental-progress-track">
                <span style={{ width: `${progressPercent}%` }} />
              </div>
              <h4>{currentQuestion.question}</h4>

              <div className="mental-options-grid">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="mental-option-btn"
                    onClick={() => {
                      handleAnswer(currentQuestion.id, option.value);
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : routineTasks.length > 0 ? (
            <div className="mental-tracker-card">
              <p className="mental-tracker-summary">
                Mai teljesítés: {completedTaskIds.length} /{" "}
                {routineTasks.length} ({completionPercent}%)
              </p>

              <div className="mental-progress-track">
                <span style={{ width: `${completionPercent}%` }} />
              </div>

              <div className="mental-task-list">
                {routineTasks.map((task) => {
                  const checked = completedTaskIds.includes(task.id);
                  return (
                    <label
                      key={task.id}
                      className={`mental-task-row ${checked ? "done" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTask(task.id)}
                      />
                      <span>{task.label}</span>
                    </label>
                  );
                })}
              </div>

              <div className="mental-actions">
                <button
                  type="button"
                  className="btn-mental-save"
                  onClick={handleSaveCompletion}
                  disabled={savingCompletion}
                >
                  {savingCompletion ? "Mentés..." : "Napi Teljesítés Mentése"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mental-empty">
              Töltsd ki a kérdőívet a napi mentális rutinhoz.
            </div>
          )}
        </section>

        <section className="motivation-section">
          <h3>📌 Mai Motiváció</h3>

          <div className="motivation-quote">
            <p className={`quote-text ${quoteVisible ? "is-visible" : ""}`}>
              {quote}
            </p>

            <button
              type="button"
              className="btn-refresh-quote"
              title="Új idézet"
              aria-label="Új motivációs idézet"
              onClick={handleRefreshQuote}
            >
              🔄
            </button>
          </div>
        </section>

        <div className="back-to-home">
          <Link to="/" className="btn-back-home">
            ← Vissza a főoldalra
          </Link>
        </div>
      </main>

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onLogout={handleLogout}
        user={user}
        onUserRefresh={setUser}
      />
    </div>
  );
}
