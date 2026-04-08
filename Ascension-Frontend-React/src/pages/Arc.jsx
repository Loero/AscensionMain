import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import ProfileModal from "../components/ProfileModal"
import "./Arc.css"
import { useAlert } from "../components/AlertContext"

const SKIN_ROUTINE_API_URL = "http://localhost:3000/api/skin/routine"
const SKIN_SAVE_ROUTINE_API_URL = "http://localhost:3000/api/skin/save-routine"
const SKIN_TRACKING_API_URL = "http://localhost:3000/api/skin/tracking"

const SKIN_TRACKING_STORAGE_KEY = "ascension_skin_tracking_v1"
const LAST_GENERATED_ROUTINE_KEY = "lastGeneratedRoutine"
const SKIN_QUIZ_ANSWERS_KEY = "skinQuizAnswers"
const CURRENT_ROUTINE_ID_KEY = "currentRoutineId"
const REQUIRED_STEPS_PER_PHASE = 3

const QUESTIONS = [
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
    multiple: true,
    options: [
      { value: "acne", label: "Pattanások, mitesszerek" },
      { value: "wrinkles", label: "Ráncok, finom vonalak" },
      { value: "pigmentation", label: "Pigmentfoltok, egyenetlen bőrszín" },
      { value: "dark_circles", label: "Sötét karikák a szem alatt" },
      { value: "pores", label: "Tág pórusok" },
      { value: "none", label: "Nincs különösebb problémám" },
    ],
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
    multiple: true,
    options: [
      { value: "cleanser", label: "Arclemosó" },
      { value: "moisturizer", label: "Hidratáló krém" },
      { value: "sunscreen", label: "Naptej" },
      { value: "serum", label: "Szérum" },
      { value: "exfoliant", label: "Hámlasztó" },
      { value: "none", label: "Semmilyen speciális terméket" },
    ],
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
    question: "Mik a céljaid a bőröddel kapcsolatban? (több is lehet)",
    multiple: true,
    options: [
      { value: "clear", label: "Tiszta, aknémentes bőr" },
      { value: "hydrated", label: "Hidratáltabb bőr" },
      { value: "bright", label: "Egységesebb, ragyogóbb tónus" },
      { value: "anti_aging", label: "Ráncok és öregedés lassítása" },
      { value: "calm", label: "Nyugodtabb, kevésbé érzékeny bőr" },
    ],
  },
]

function getTodayStr() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function stripSkinStepLabel(value) {
  return String(value || "")
    .replace(/[^a-zA-Z0-9\s.,:()\-+/%áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

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
  }
}

function getSkinTypeLabel(skinType) {
  const labels = {
    normal: "Normál",
    dry: "Száraz",
    oily: "Zsíros",
    combination: "Vegyes",
    sensitive: "Érzékeny",
  }
  return labels[skinType] || skinType
}

function generateClientSideRoutine(answers) {
  const skinType = answers.skin_type || "normal"
  const age = answers.age || "25_35"
  const concerns = Array.isArray(answers.concerns) ? answers.concerns : []
  const goals = Array.isArray(answers.goals) ? answers.goals : []

  const routine = {
    skin_type: skinType,
    age_group: age,
    concerns,
    goals,
    morning_routine: [
      "🌅 Arclemosás (langyos víz)",
      "💧 Tonizálás",
      "🧴 Hidratáló krém",
      "☀️ Naptej (SPF 30+)",
    ],
    evening_routine: [
      "🌙 Sminklemosás / szennyeződés eltávolítása",
      "🧼 Mélytisztítás",
      "💡 Szérum (problémák szerint)",
      "🌙 Éjszakai krém",
    ],
    weekly_treatments: [],
    product_recommendations: [],
    tips: [],
  }

  if (concerns.includes("acne")) {
    routine.weekly_treatments.push("🧪 Heti 1x BHA hámlasztás")
    routine.product_recommendations.push("Szalicilsavas toner")
  }

  if (concerns.includes("wrinkles")) {
    routine.weekly_treatments.push("⏰ Retinol fokozatos bevezetése")
    routine.product_recommendations.push("Retinol szérum")
  }

  if (concerns.includes("pigmentation")) {
    routine.product_recommendations.push("C-vitamin szérum")
    routine.weekly_treatments.push("✨ Gyengéd hámlasztás heti 1x")
  }

  if (skinType === "dry") {
    routine.tips.push("💧 Igyál több vizet.")
    routine.tips.push("🧴 Használj gazdagabb hidratálót.")
  } else if (skinType === "oily") {
    routine.tips.push("🌿 Kerüld a túl agresszív tisztítást.")
    routine.tips.push("🧻 Válassz olajmentes termékeket.")
  } else if (skinType === "sensitive") {
    routine.tips.push("🫧 Kerüld az erős illatanyagokat.")
    routine.tips.push("🧪 Egyszerre csak egy új terméket vezess be.")
  }

  if (goals.includes("bright")) {
    routine.product_recommendations.push("Niacinamide szérum")
  }
  if (goals.includes("hydrated")) {
    routine.product_recommendations.push("Hialuronsav szérum")
  }

  return normalizeRoutineData(routine)
}

function getRequiredStepsFromRoutine(routine) {
  const pickTopThree = (list, phase) =>
    (Array.isArray(list) ? list : [])
      .map((step) => stripSkinStepLabel(step))
      .filter(Boolean)
      .slice(0, REQUIRED_STEPS_PER_PHASE)
      .map((label, index) => ({
        id: `${phase}-${index}-${label}`,
        label,
        phase,
      }))

  return [
    ...pickTopThree(routine?.morning_routine, "morning"),
    ...pickTopThree(routine?.evening_routine, "evening"),
  ]
}

function loadSkinTrackingMap() {
  try {
    const raw = localStorage.getItem(SKIN_TRACKING_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

function saveSkinTrackingEntry(entry) {
  const map = loadSkinTrackingMap()
  map[entry.date] = entry
  localStorage.setItem(SKIN_TRACKING_STORAGE_KEY, JSON.stringify(map))
}

function getSkinTrackingEntry(dateKey) {
  const map = loadSkinTrackingMap()
  return map[dateKey] || null
}

function calculateTrackerMetrics(requiredSteps, completedStepIds) {
  const requiredCount = requiredSteps.length
  const completedCount = completedStepIds.filter((stepId) =>
    requiredSteps.some((step) => step.id === stepId)
  ).length

  const morningRequired = requiredSteps.filter((step) => step.phase === "morning")
  const eveningRequired = requiredSteps.filter((step) => step.phase === "evening")
  const morningCompleted = morningRequired.filter((step) =>
    completedStepIds.includes(step.id)
  )
  const eveningCompleted = eveningRequired.filter((step) =>
    completedStepIds.includes(step.id)
  )

  const percent =
    requiredCount > 0
      ? Math.min(100, Math.round((completedCount / requiredCount) * 100))
      : 0

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
  }
}

export default function Arc() {
  const navigate = useNavigate()
  const { showAlert } = useAlert()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [routine, setRoutine] = useState(null)
  const [loadingRoutine, setLoadingRoutine] = useState(true)
  const [savingRoutine, setSavingRoutine] = useState(false)
  const [savingTracking, setSavingTracking] = useState(false)

  const [trackerDate, setTrackerDate] = useState(getTodayStr())
  const [completedStepIds, setCompletedStepIds] = useState([])

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("authToken")
    if (!token) return null
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }, [user])

  const requiredSteps = useMemo(
    () => getRequiredStepsFromRoutine(routine),
    [routine]
  )

  const trackerMetrics = useMemo(
    () => calculateTrackerMetrics(requiredSteps, completedStepIds),
    [requiredSteps, completedStepIds]
  )

  const progressPercent = Math.round(((currentQuestion + 1) / QUESTIONS.length) * 100)
  const currentQuestionData = QUESTIONS[currentQuestion]

  useEffect(() => {
    document.title = "Ascension - Arc"
  }, [])

  useEffect(() => {
    const syncAuth = () => {
      try {
        const token = localStorage.getItem("authToken")
        const rawUser = localStorage.getItem("user")
        if (!token || !rawUser) {
          setUser(null)
          return
        }
        setUser(JSON.parse(rawUser))
      } catch {
        setUser(null)
      }
    }

    syncAuth()
    window.addEventListener("focus", syncAuth)
    window.addEventListener("storage", syncAuth)
    return () => {
      window.removeEventListener("focus", syncAuth)
      window.removeEventListener("storage", syncAuth)
    }
  }, [])

  useEffect(() => {
    const today = getTodayStr()
    if (trackerDate !== today) {
      setTrackerDate(today)
    }
  }, [trackerDate])

  useEffect(() => {
    const localAnswers = localStorage.getItem(SKIN_QUIZ_ANSWERS_KEY)
    if (localAnswers) {
      try {
        setAnswers(JSON.parse(localAnswers))
      } catch { }
    }
  }, [])

  useEffect(() => {
    const loadExistingRoutine = async () => {
      setLoadingRoutine(true)

      try {
        if (authHeaders) {
          const response = await fetch(SKIN_ROUTINE_API_URL, {
            method: "GET",
            headers: authHeaders,
          })
          const data = await response.json()

          if (data.success && data.routine) {
            const normalized = normalizeRoutineData(data.routine)
            setRoutine(normalized)
            localStorage.setItem(
              LAST_GENERATED_ROUTINE_KEY,
              JSON.stringify(normalized)
            )
            if (normalized.id) {
              localStorage.setItem(CURRENT_ROUTINE_ID_KEY, String(normalized.id))
            }
          } else {
            const localRoutineRaw = localStorage.getItem(LAST_GENERATED_ROUTINE_KEY)
            if (localRoutineRaw) {
              const localRoutine = normalizeRoutineData(JSON.parse(localRoutineRaw))
              setRoutine(localRoutine)
            }
          }
        } else {
          const localRoutineRaw = localStorage.getItem(LAST_GENERATED_ROUTINE_KEY)
          if (localRoutineRaw) {
            const localRoutine = normalizeRoutineData(JSON.parse(localRoutineRaw))
            setRoutine(localRoutine)
          }
        }
      } catch {
        try {
          const localRoutineRaw = localStorage.getItem(LAST_GENERATED_ROUTINE_KEY)
          if (localRoutineRaw) {
            const localRoutine = normalizeRoutineData(JSON.parse(localRoutineRaw))
            setRoutine(localRoutine)
          }
        } catch { }
      } finally {
        setLoadingRoutine(false)
      }
    }

    loadExistingRoutine()
  }, [authHeaders])

  useEffect(() => {
    const loadTracking = async () => {
      if (!routine) {
        setCompletedStepIds([])
        return
      }

      const localEntry = getSkinTrackingEntry(trackerDate)
      let nextCompleted = Array.isArray(localEntry?.completedStepIds)
        ? localEntry.completedStepIds
        : []

      if (authHeaders && routine.id) {
        try {
          const response = await fetch(
            `${SKIN_TRACKING_API_URL}?routine_id=${encodeURIComponent(
              routine.id
            )}&date=${encodeURIComponent(trackerDate)}`,
            {
              headers: {
                Authorization: authHeaders.Authorization,
              },
            }
          )
          const data = await response.json()

          if (data.success && data.tracking) {
            const completedLabels = [
              ...(Array.isArray(data.tracking.morning_steps)
                ? data.tracking.morning_steps
                : []),
              ...(Array.isArray(data.tracking.evening_steps)
                ? data.tracking.evening_steps
                : []),
            ].map((step) => stripSkinStepLabel(step))

            nextCompleted = requiredSteps
              .filter((step) => completedLabels.includes(step.label))
              .map((step) => step.id)
          }
        } catch { }
      }

      setCompletedStepIds(nextCompleted)
    }

    loadTracking()
  }, [routine, trackerDate, authHeaders, requiredSteps])

  useEffect(() => {
    const timer = setInterval(() => {
      const today = getTodayStr()
      if (today !== trackerDate) {
        setTrackerDate(today)
      }
    }, 30000)

    return () => clearInterval(timer)
  }, [trackerDate])

  const handleSingleAnswer = (questionId, value) => {
    const nextAnswers = { ...answers, [questionId]: value }
    setAnswers(nextAnswers)
    localStorage.setItem(SKIN_QUIZ_ANSWERS_KEY, JSON.stringify(nextAnswers))
  }

  const handleMultiAnswer = (questionId, value) => {
    const currentValues = Array.isArray(answers[questionId]) ? answers[questionId] : []
    const nextValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value]

    const nextAnswers = { ...answers, [questionId]: nextValues }
    setAnswers(nextAnswers)
    localStorage.setItem(SKIN_QUIZ_ANSWERS_KEY, JSON.stringify(nextAnswers))
  }

  const isQuestionAnswered = () => {
    const value = answers[currentQuestionData.id]
    if (currentQuestionData.multiple) return Array.isArray(value) && value.length > 0
    return Boolean(value)
  }

  const handleNext = async () => {
    if (!isQuestionAnswered()) {
      await showAlert("Válassz legalább egy opciót a továbblépéshez.")
      return
    }
    setCurrentQuestion((prev) => Math.min(prev + 1, QUESTIONS.length - 1))
  }

  const handlePrev = () => {
    setCurrentQuestion((prev) => Math.max(prev - 1, 0))
  }

  const handleGenerateRoutine = async () => {
    if (!isQuestionAnswered()) {
      await showAlert("Válassz legalább egy opciót a rutin generálásához.")
      return
    }

    const generated = generateClientSideRoutine(answers)
    setRoutine(generated)
    localStorage.setItem(LAST_GENERATED_ROUTINE_KEY, JSON.stringify(generated))
    localStorage.setItem(SKIN_QUIZ_ANSWERS_KEY, JSON.stringify(answers))
  }

  const handleResetQuiz = () => {
    setCurrentQuestion(0)
    setAnswers({})
    setRoutine(null)
    localStorage.removeItem(LAST_GENERATED_ROUTINE_KEY)
    localStorage.removeItem(SKIN_QUIZ_ANSWERS_KEY)
    localStorage.removeItem(CURRENT_ROUTINE_ID_KEY)
  }

  const handleSaveRoutine = async () => {
    if (!authHeaders) {
      await showAlert("A rutin mentéséhez be kell jelentkezned!")
      return
    }

    if (!routine) {
      await showAlert("Előbb generálj rutint.")
      return
    }

    setSavingRoutine(true)
    try {
      const response = await fetch(SKIN_SAVE_ROUTINE_API_URL, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          answers,
          routine,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        await showAlert(`Hiba a mentés során: ${data.error || "ismeretlen hiba"}`)
        return
      }

      const savedRoutine = { ...routine, id: data.routine_id }
      setRoutine(savedRoutine)
      localStorage.setItem(LAST_GENERATED_ROUTINE_KEY, JSON.stringify(savedRoutine))
      localStorage.setItem(CURRENT_ROUTINE_ID_KEY, String(data.routine_id))

      if (data.unchanged) {
        await showAlert("Nincs változás a rutinban.")
      } else if (data.updated) {
        await showAlert(`Rutin frissítve! ID: ${data.routine_id}`)
      } else {
        await showAlert(`Rutin sikeresen elmentve! ID: ${data.routine_id}`)
      }
    } catch (error) {
      await showAlert(`Hiba a mentés során: ${error.message}`)
    } finally {
      setSavingRoutine(false)
    }
  }

  const toggleTrackerStep = (stepId) => {
    setCompletedStepIds((prev) => {
      const next = prev.includes(stepId)
        ? prev.filter((id) => id !== stepId)
        : [...prev, stepId]

      saveSkinTrackingEntry({
        date: trackerDate,
        completedStepIds: next,
        completedCount: next.length,
      })

      return next
    })
  }

  const handleSaveTracking = async () => {
    if (!routine?.id) {
      await showAlert("Nincs menthető napi arc követés. Előbb legyen elmentett rutinod.")
      return
    }

    if (!authHeaders) {
      await showAlert("A napi követés mentéséhez be kell jelentkezned.")
      return
    }

    setSavingTracking(true)
    try {
      const metrics = calculateTrackerMetrics(requiredSteps, completedStepIds)

      const response = await fetch(SKIN_TRACKING_API_URL, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          routine_id: routine.id,
          date: trackerDate,
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
      })

      const data = await response.json()
      if (!data.success) {
        await showAlert(data.error || "Nem sikerült menteni a napi követést.")
        return
      }

      await showAlert(
        `Napi arc követés mentve! ${metrics.completedCount}/${metrics.requiredCount} lépés (${metrics.percent}%).`
      )
      window.dispatchEvent(new Event("focus"))
    } catch (error) {
      await showAlert(`Hiba a mentés során: ${error.message}`)
    } finally {
      setSavingTracking(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    setUser(null)
    setIsProfileOpen(false)
    navigate("/")
  }

  return (
    <div className="arc-page">
      <Navbar onOpenProfile={() => setIsProfileOpen(true)} user={user} />

      <main className="arc-content">
        <h1 className="arc-title">Az Ascension arc program</h1>

        <div className="arc-intro">
          <section className="arc-hero">
            <p className="arc-kicker">Ascension Arc</p>
            <h2 className="arc-hero-title">
              Tiszta rendszer, jobb bőrkép, mérhető fejlődés.
            </h2>
            <p className="arc-hero-copy">
              Rövid elemzés után személyre szabott rutint kapsz, amit könnyű
              követni, és aminek látható eredménye van.
            </p>

            <div className="arc-pill-row">
              <span className="arc-pill">10 kérdéses elemzés</span>
              <span className="arc-pill">Személyre szabott rutin</span>
              <span className="arc-pill">Napi követhetőség</span>
            </div>

            <a className="arc-hero-cta" href="#skin-analysis-section">
              Elemzés indítása
            </a>
          </section>

          <section className="arc-feature-grid" aria-label="Arc funkciók">
            <article className="arc-feature-card">
              <div className="arc-feature-top">
                <span className="arc-feature-dot"></span>
                <span className="arc-feature-step">01</span>
              </div>
              <h3>Bőrtípus elemzés</h3>
              <p>10 pontos kérdőívvel pontos képet kapsz a kiindulási állapotról.</p>
            </article>

            <article className="arc-feature-card">
              <div className="arc-feature-top">
                <span className="arc-feature-dot"></span>
                <span className="arc-feature-step">02</span>
              </div>
              <h3>Személyre szabás</h3>
              <p>A rutinod a bőrtípusodhoz és céljaidhoz lesz optimalizálva.</p>
            </article>

            <article className="arc-feature-card">
              <div className="arc-feature-top">
                <span className="arc-feature-dot"></span>
                <span className="arc-feature-step">03</span>
              </div>
              <h3>Fejlődés követés</h3>
              <p>Következetes rendszerrel látod, mi működik és mi nem.</p>
            </article>
          </section>
        </div>

        <section className="core-section" id="daily-skin-section">
          <h3>Napi arc követés</h3>

          <div className="quiz-container">
            {!routine ? (
              <div className="profile-empty-state">
                <p>Előbb generálj vagy tölts be egy rutint az elemzésből.</p>
              </div>
            ) : (
              <div className="daily-skin-tracker">
                <div className="daily-skin-header">
                  <div>
                    <h4>Mai rutin követés</h4>
                    <p>
                      {trackerMetrics.completedCount}/{trackerMetrics.requiredCount} lépés
                      teljesítve ({trackerMetrics.percent}%)
                    </p>
                  </div>

                  <div className="quiz-progress compact">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${trackerMetrics.percent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="tracker-phase-grid">
                  <div className="tracker-phase-card">
                    <h5>Reggel</h5>
                    <div className="tracker-step-list">
                      {requiredSteps
                        .filter((step) => step.phase === "morning")
                        .map((step) => (
                          <label className="quiz-option tracker-option" key={step.id}>
                            <input
                              type="checkbox"
                              checked={completedStepIds.includes(step.id)}
                              onChange={() => toggleTrackerStep(step.id)}
                            />
                            <span className="option-text">{step.label}</span>
                          </label>
                        ))}
                    </div>
                  </div>

                  <div className="tracker-phase-card">
                    <h5>Este</h5>
                    <div className="tracker-step-list">
                      {requiredSteps
                        .filter((step) => step.phase === "evening")
                        .map((step) => (
                          <label className="quiz-option tracker-option" key={step.id}>
                            <input
                              type="checkbox"
                              checked={completedStepIds.includes(step.id)}
                              onChange={() => toggleTrackerStep(step.id)}
                            />
                            <span className="option-text">{step.label}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="routine-actions">
              <button
                className="btn-quiz btn-primary"
                type="button"
                onClick={handleSaveTracking}
                disabled={!routine || !routine.id || savingTracking}
              >
                {savingTracking ? "Mentés..." : "Napi Követés Mentése"}
              </button>
            </div>
          </div>
        </section>

        <section className="core-section" id="skin-analysis-section">
          <h3>Bőrtípus elemzés</h3>

          {loadingRoutine ? (
            <div className="quiz-container">
              <p className="progress-text">Rutin betöltése...</p>
            </div>
          ) : !routine ? (
            <div className="quiz-container" id="skinQuiz">
              <div className="quiz-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="progress-text">
                  {currentQuestion + 1} / {QUESTIONS.length}
                </span>
              </div>

              <div className="quiz-question" id="questionContainer">
                <div className="question-content">
                  <h4 className="question-title">{currentQuestionData.question}</h4>

                  <div className="options-container">
                    {currentQuestionData.options.map((option) => {
                      const checked = currentQuestionData.multiple
                        ? Array.isArray(answers[currentQuestionData.id]) &&
                        answers[currentQuestionData.id].includes(option.value)
                        : answers[currentQuestionData.id] === option.value

                      return (
                        <label className="quiz-option" key={option.value}>
                          <input
                            type={currentQuestionData.multiple ? "checkbox" : "radio"}
                            name={currentQuestionData.id}
                            checked={checked}
                            onChange={() =>
                              currentQuestionData.multiple
                                ? handleMultiAnswer(currentQuestionData.id, option.value)
                                : handleSingleAnswer(currentQuestionData.id, option.value)
                            }
                          />
                          <span className="option-text">{option.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="quiz-controls">
                {currentQuestion > 0 ? (
                  <button className="btn-quiz" type="button" onClick={handlePrev}>
                    ← Vissza
                  </button>
                ) : (
                  <span />
                )}

                {currentQuestion < QUESTIONS.length - 1 ? (
                  <button className="btn-quiz" type="button" onClick={handleNext}>
                    Tovább →
                  </button>
                ) : (
                  <button
                    className="btn-quiz btn-primary"
                    type="button"
                    onClick={handleGenerateRoutine}
                  >
                    Rutin generálása
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="routine-result">
              <div className="routine-header">
                <h3>Személyre szabott arcápolási rutin</h3>
                <p>
                  Bőrtípusod: <strong>{getSkinTypeLabel(routine.skin_type)}</strong>
                </p>
              </div>

              <div className="routine-section">
                <h4>Reggeli rutin</h4>
                <ul className="routine-steps">
                  {routine.morning_routine.length ? (
                    routine.morning_routine.map((step, index) => (
                      <li key={`morning-${index}`}>{stripSkinStepLabel(step)}</li>
                    ))
                  ) : (
                    <li>Még nincs mentett reggeli rutin.</li>
                  )}
                </ul>
              </div>

              <div className="routine-section">
                <h4>Esti rutin</h4>
                <ul className="routine-steps">
                  {routine.evening_routine.length ? (
                    routine.evening_routine.map((step, index) => (
                      <li key={`evening-${index}`}>{stripSkinStepLabel(step)}</li>
                    ))
                  ) : (
                    <li>Még nincs mentett esti rutin.</li>
                  )}
                </ul>
              </div>

              {routine.weekly_treatments.length > 0 && (
                <div className="routine-section">
                  <h4>Heti kezelések</h4>
                  <ul className="routine-steps">
                    {routine.weekly_treatments.map((item, index) => (
                      <li key={`weekly-${index}`}>{stripSkinStepLabel(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {routine.product_recommendations.length > 0 && (
                <div className="routine-section">
                  <h4>Ajánlott termékek</h4>
                  <ul className="routine-steps">
                    {routine.product_recommendations.map((item, index) => (
                      <li key={`product-${index}`}>{stripSkinStepLabel(item)}</li>
                    ))}
                  </ul>
                </div>
              )}

              {routine.tips.length > 0 && (
                <div className="routine-section">
                  <h4>További tanácsok</h4>
                  <ul className="routine-tips">
                    {routine.tips.map((tip, index) => (
                      <li key={`tip-${index}`}>{stripSkinStepLabel(tip)}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="routine-actions">
                <button
                  className="btn-quiz btn-primary"
                  type="button"
                  onClick={handleSaveRoutine}
                  disabled={savingRoutine}
                >
                  {savingRoutine ? "Mentés..." : "Rutin Mentése"}
                </button>
                <button className="btn-quiz" type="button" onClick={handleResetQuiz}>
                  Új Kérdőív
                </button>
              </div>
            </div>
          )}
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
  )
}