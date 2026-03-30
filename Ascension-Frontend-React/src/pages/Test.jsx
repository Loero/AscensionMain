import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import ProfileModal from "../components/ProfileModal"
import "./Test.css"


const PROFILE_API_URL = "http://localhost:3000/api/profile"
const FOOD_ADD_API_URL = "http://localhost:3000/api/food/add"
const FOOD_ENTRIES_API_URL = "http://localhost:3000/api/food/entries"
const WORKOUT_API_URL = "http://localhost:3000/api/workout"
const NUTRITION_SEARCH_API_URL = "http://localhost:3000/nutrition/search"

const PLAN_KEY = "ascension_training_plan_v1"
const PERSONAL_KEY = "ascension_personal_v1"
const ACTIVE_WORKOUT_DAY_KEY = "ascension_active_workout_day_v1"
const ACTIVE_WORKOUT_DAY_DATE_KEY = "ascension_active_workout_day_date_v1"

function roundNum(n) {
  return Math.round(Number(n || 0) * 10) / 10
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0]
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

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
  ]

  return `${date.getDate()} ${months[date.getMonth()]}, ${date.getFullYear()}`
}

function normalizeDayToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*[-]\s*.*/, "")
    .replace(/[()]/g, "")
    .trim()
}

function doesPlanDayMatchToday(planDayLabel, todayName) {
  if (!planDayLabel || !todayName) return false

  const normalized = normalizeDayToken(planDayLabel)
  const todayNormalized = normalizeDayToken(todayName)

  return normalized
    .split("/")
    .map((part) => part.trim())
    .some((part) => part === todayNormalized)
}

function getDefaultSetsByExperience(experience) {
  if (experience === "beginner") return 3
  if (experience === "intermediate") return 4
  return 4
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
    }
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
    }
  }

  return {
    "Hétfő/Csütörtök - Push": [
      "Fekvenyomás",
      "Ferde fekvenyomás",
      "Vállnyomás",
    ],
    "Kedd/Péntek - Pull": ["Felhúzás", "Húzódzkodás", "T-bar evezés"],
    "Szerda/Szombat - Legs": ["Guggolás", "Lábtoló", "Román felhúzás"],
  }
}

function getSetTargetsByExperience(experience) {
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
    }
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
    }
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
  }
}

function getGoalAdvice(goal) {
  if (goal === "deficit") {
    return "🔥 Fogyás: Tartsd meg az erődet, fókuszálj a technikára."
  }
  if (goal === "surplus") {
    return "💪 Tömegnövelés: Progresszíven növeld a súlyokat!"
  }
  return "⚖️ Tartás: Tartsd az erőszinted."
}

export default function Test() {
  const navigate = useNavigate()

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("user")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [form, setForm] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "",
    activity: "",
    goal: "",
    experience: "",
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [foodLoading, setFoodLoading] = useState(false)

  const [results, setResults] = useState(null)
  const [planStructure, setPlanStructure] = useState({})
  const [planSetTargets, setPlanSetTargets] = useState({})
  const [activeWorkoutDay, setActiveWorkoutDay] = useState("")
  const [exerciseInputs, setExerciseInputs] = useState({})

  const [foodQuery, setFoodQuery] = useState("")
  const [foodGrams, setFoodGrams] = useState("")
  const [foodSearchResults, setFoodSearchResults] = useState([])
  const [selectedFood, setSelectedFood] = useState(null)
  const [foodEntries, setFoodEntries] = useState([])

  const [workoutEntries, setWorkoutEntries] = useState([])

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem("authToken")
    if (!token) return null

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }
  }, [user])

  const availablePlanDays = useMemo(
    () => Object.keys(planStructure || {}),
    [planStructure]
  )

  const currentDayExercises = useMemo(() => {
    if (!activeWorkoutDay || !planStructure[activeWorkoutDay]) return []
    return planStructure[activeWorkoutDay]
  }, [activeWorkoutDay, planStructure])

  const foodPreview = useMemo(() => {
    if (!selectedFood) return null

    const grams = parseFloat(foodGrams) || 100
    const scale = grams / 100
    const kcal = roundNum((selectedFood.nutrients?.energyKcal || 0) * scale)
    const protein = roundNum((selectedFood.nutrients?.proteinG || 0) * scale)
    const carbs = roundNum((selectedFood.nutrients?.carbG || 0) * scale)

    return {
      grams,
      kcal,
      protein,
      carbs,
      description: selectedFood.description,
    }
  }, [selectedFood, foodGrams])

  const foodTotals = useMemo(() => {
    return foodEntries.reduce(
      (acc, entry) => {
        acc.kcal += Number(entry.energyKcal || 0)
        acc.protein += Number(entry.proteinG || 0)
        acc.carbs += Number(entry.carbG || 0)
        return acc
      },
      { kcal: 0, protein: 0, carbs: 0 }
    )
  }, [foodEntries])

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
    try {
      const raw = localStorage.getItem(PERSONAL_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)
      setForm({
        age: parsed.age ?? "",
        weight: parsed.weight ?? "",
        height: parsed.height ?? "",
        gender: parsed.gender ?? "",
        activity: parsed.activity ?? "",
        goal: parsed.goal ?? "",
        experience: parsed.experience ?? "",
      })
    } catch { }
  }, [])

  useEffect(() => {
    loadSavedPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (authHeaders) {
      loadFoodEntries()
      loadWorkouts()
      loadProfilePersonal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeaders])

  useEffect(() => {
    if (!foodQuery.trim()) {
      setFoodSearchResults([])
      setSelectedFood(null)
      return
    }

    const timer = setTimeout(() => {
      searchFood(foodQuery)
    }, 350)

    return () => clearTimeout(timer)
  }, [foodQuery])

  useEffect(() => {
    if (!availablePlanDays.length) return

    const savedDay = localStorage.getItem(ACTIVE_WORKOUT_DAY_KEY)
    const savedDayDate = localStorage.getItem(ACTIVE_WORKOUT_DAY_DATE_KEY)
    const isSameDay = savedDayDate === getTodayStr()

    if (savedDay && isSameDay && availablePlanDays.includes(savedDay)) {
      setActiveWorkoutDay(savedDay)
      return
    }

    const todayName = new Date().toLocaleDateString("hu-HU", {
      weekday: "long",
    })

    const matchedToday =
      availablePlanDays.find((day) => doesPlanDayMatchToday(day, todayName)) ||
      availablePlanDays[0]

    setActiveWorkoutDay(matchedToday)
  }, [availablePlanDays])

  useEffect(() => {
    if (!activeWorkoutDay) return

    localStorage.setItem(ACTIVE_WORKOUT_DAY_KEY, activeWorkoutDay)
    localStorage.setItem(ACTIVE_WORKOUT_DAY_DATE_KEY, getTodayStr())

    setExerciseInputs((prev) => {
      const next = { ...prev }
      currentDayExercises.forEach((exercise) => {
        const key = `${activeWorkoutDay}__${exercise}`
        if (!next[key]) {
          next[key] = { weight: "", sets: "", reps: "" }
        }
      })
      return next
    })
  }, [activeWorkoutDay, currentDayExercises])

  async function loadProfilePersonal() {
    if (!authHeaders) return

    try {
      const response = await fetch(PROFILE_API_URL, {
        method: "GET",
        headers: authHeaders,
      })
      const data = await response.json()

      if (!data.success) return

      const personal = data.profile?.personal
      const fetchedUser = data.profile?.user

      if (fetchedUser) {
        localStorage.setItem("user", JSON.stringify(fetchedUser))
        setUser(fetchedUser)
      }

      if (personal) {
        const mapped = {
          age: personal.age ?? "",
          weight: personal.weightKg ?? "",
          height: personal.heightCm ?? "",
          gender: personal.gender ?? "",
          activity: personal.activityMultiplier ?? "",
          goal: personal.goal ?? "",
          experience: personal.experience ?? "",
        }
        setForm((prev) => ({ ...prev, ...mapped }))
        localStorage.setItem(
          PERSONAL_KEY,
          JSON.stringify({
            age: mapped.age,
            weight: mapped.weight,
            height: mapped.height,
            gender: mapped.gender,
            activity: mapped.activity,
            goal: mapped.goal,
            experience: mapped.experience,
          })
        )
      }
    } catch { }
  }

  async function loadFoodEntries() {
    if (!authHeaders) return

    try {
      const res = await fetch(`${FOOD_ENTRIES_API_URL}?date=${getTodayStr()}`, {
        method: "GET",
        headers: authHeaders,
      })
      const data = await res.json()

      if (!data.success || !Array.isArray(data.entries)) {
        setFoodEntries([])
        return
      }

      setFoodEntries(
        data.entries.map((entry) => ({
          id: entry.id,
          description: entry.food_name,
          grams: entry.grams,
          energyKcal: Number(entry.calories || 0),
          proteinG: Number(entry.protein_g || 0),
          carbG: Number(entry.carbs_g || 0),
          createdAt: entry.created_at,
        }))
      )
    } catch {
      setFoodEntries([])
    }
  }

  async function loadWorkouts() {
    if (!authHeaders) return

    try {
      const today = getTodayStr()
      const res = await fetch(
        `${WORKOUT_API_URL}?startDate=${today}&endDate=${today}`,
        {
          method: "GET",
          headers: authHeaders,
        }
      )
      const data = await res.json()

      if (!data.success || !Array.isArray(data.entries)) {
        setWorkoutEntries([])
        return
      }

      setWorkoutEntries(data.entries)
    } catch {
      setWorkoutEntries([])
    }
  }

  async function searchFood(query) {
    try {
      setFoodLoading(true)
      const resp = await fetch(
        `${NUTRITION_SEARCH_API_URL}?query=${encodeURIComponent(query)}`
      )
      const data = await resp.json()
      setFoodSearchResults(Array.isArray(data.items) ? data.items : [])
    } catch {
      setFoodSearchResults([])
    } finally {
      setFoodLoading(false)
    }
  }

  async function savePersonalData(personalData) {
    localStorage.setItem(PERSONAL_KEY, JSON.stringify(personalData))

    if (!authHeaders) return true

    try {
      await fetch("http://localhost:3000/api/profile/personal", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          age: Number(personalData.age),
          weightKg: Number(personalData.weight),
          heightCm: Number(personalData.height),
          gender: personalData.gender,
          activityMultiplier: Number(personalData.activity),
          goal: personalData.goal,
          experience: personalData.experience,
        }),
      })
      return true
    } catch {
      return false
    }
  }

  async function handleGeneratePlan() {
    const age = Number(form.age)
    const weight = Number(form.weight)
    const height = Number(form.height)
    const activity = Number(form.activity)

    if (
      !age ||
      !weight ||
      !height ||
      !form.gender ||
      !activity ||
      !form.goal ||
      !form.experience
    ) {
      alert("Tölts ki minden mezőt a terv generálásához!")
      return
    }

    setIsGenerating(true)

    try {
      await savePersonalData(form)

      const bmr =
        form.gender === "male"
          ? 10 * weight + 6.25 * height - 5 * age + 5
          : 10 * weight + 6.25 * height - 5 * age - 161

      const tdee = bmr * activity
      let targetCalories = tdee

      if (form.goal === "deficit") targetCalories -= 400
      if (form.goal === "surplus") targetCalories += 300
      if (targetCalories < 1200) targetCalories = 1200

      const protein = Math.round(weight * 2)
      const fat = roundNum((targetCalories * 0.25) / 9)
      const carbs = roundNum((targetCalories - protein * 4 - fat * 9) / 4)

      const nextPlanStructure = getPlanStructureByExperience(form.experience)
      const nextSetTargets = getSetTargetsByExperience(form.experience)

      setResults({
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        goalCalories: Math.round(targetCalories),
        protein,
        fat: Math.max(0, fat),
        carbs: Math.max(0, carbs),
        goalAdvice: getGoalAdvice(form.goal),
      })

      setPlanStructure(nextPlanStructure)
      setPlanSetTargets(nextSetTargets)

      localStorage.setItem(
        PLAN_KEY,
        JSON.stringify({
          exercises: Object.values(nextPlanStructure).flat(),
          experience: form.experience,
          goal: form.goal,
          planStructure: nextPlanStructure,
          setTargets: nextSetTargets,
        })
      )
    } finally {
      setIsGenerating(false)
    }
  }

  function loadSavedPlan() {
    try {
      const raw = localStorage.getItem(PLAN_KEY)
      if (!raw) return

      const parsed = JSON.parse(raw)
      const experience = parsed.experience || "beginner"
      const goal = parsed.goal || "maintain"

      const nextPlanStructure =
        parsed.planStructure || getPlanStructureByExperience(experience)
      const nextSetTargets =
        parsed.setTargets || getSetTargetsByExperience(experience)

      setPlanStructure(nextPlanStructure)
      setPlanSetTargets(nextSetTargets)

      setForm((prev) => ({
        ...prev,
        experience,
        goal: prev.goal || goal,
      }))

      const personalRaw = localStorage.getItem(PERSONAL_KEY)
      if (personalRaw) {
        const personal = JSON.parse(personalRaw)
        const age = Number(personal.age || 0)
        const weight = Number(personal.weight || 0)
        const height = Number(personal.height || 0)
        const activity = Number(personal.activity || 0)
        const gender = personal.gender
        const currentGoal = personal.goal || goal

        if (age && weight && height && activity && gender) {
          const bmr =
            gender === "male"
              ? 10 * weight + 6.25 * height - 5 * age + 5
              : 10 * weight + 6.25 * height - 5 * age - 161

          const tdee = bmr * activity
          let targetCalories = tdee

          if (currentGoal === "deficit") targetCalories -= 400
          if (currentGoal === "surplus") targetCalories += 300
          if (targetCalories < 1200) targetCalories = 1200

          const protein = Math.round(weight * 2)
          const fat = roundNum((targetCalories * 0.25) / 9)
          const carbs = roundNum((targetCalories - protein * 4 - fat * 9) / 4)

          setResults({
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            goalCalories: Math.round(targetCalories),
            protein,
            fat: Math.max(0, fat),
            carbs: Math.max(0, carbs),
            goalAdvice: getGoalAdvice(currentGoal),
          })
        }
      }
    } catch { }
  }

  function getTargetSetsForExercise(dayName, exercise) {
    const dayTargets = planSetTargets?.[dayName]
    const exerciseTarget = dayTargets?.[exercise]
    if (exerciseTarget && exerciseTarget > 0) return exerciseTarget
    return getDefaultSetsByExperience(form.experience || "beginner")
  }

  function handleExerciseInputChange(exercise, field, value) {
    const key = `${activeWorkoutDay}__${exercise}`
    setExerciseInputs((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || { weight: "", sets: "", reps: "" }),
        [field]: value,
      },
    }))
  }

  async function handleAddFood() {
    const grams = Number(foodGrams)

    if (!selectedFood) {
      alert("Válassz ki egy ételt a listából!")
      return
    }

    if (!grams || grams <= 0) {
      alert("Adj meg érvényes gramm mennyiséget!")
      return
    }

    const scale = grams / 100
    const calories = roundNum((selectedFood.nutrients?.energyKcal || 0) * scale)
    const proteinG = roundNum((selectedFood.nutrients?.proteinG || 0) * scale)
    const carbG = roundNum((selectedFood.nutrients?.carbG || 0) * scale)

    if (authHeaders) {
      try {
        const response = await fetch(FOOD_ADD_API_URL, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            foodName: selectedFood.description,
            grams,
            calories,
            proteinG,
            carbsG: carbG,
            date: getTodayStr(),
          }),
        })

        const data = await response.json()
        if (!data.success) {
          alert(data.error || "Hiba történt az étel mentése során.")
          return
        }
      } catch {
        alert("Hálózati hiba történt az étel mentése közben.")
        return
      }
    }

    const localEntry = {
      id: Date.now(),
      description: selectedFood.description,
      grams,
      energyKcal: calories,
      proteinG,
      carbG,
    }

    setFoodEntries((prev) => [...prev, localEntry])
    setFoodQuery("")
    setFoodGrams("")
    setSelectedFood(null)
    setFoodSearchResults([])
  }

  async function handleDeleteFood(id) {
    if (!authHeaders) {
      setFoodEntries((prev) => prev.filter((entry) => entry.id !== id))
      return
    }

    try {
      const response = await fetch(`http://localhost:3000/api/food/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      })
      const data = await response.json()

      if (!data.success) {
        alert(data.error || "Nem sikerült törölni az ételt.")
        return
      }

      setFoodEntries((prev) => prev.filter((entry) => entry.id !== id))
    } catch {
      alert("Hálózati hiba történt az étel törlése közben.")
    }
  }

  async function handleSaveWorkout() {
    if (!authHeaders) {
      alert("Az edzés mentéséhez jelentkezz be.")
      return
    }

    if (!activeWorkoutDay || !currentDayExercises.length) {
      alert("Nincs aktív tervnap kiválasztva.")
      return
    }

    const validEntries = currentDayExercises
      .map((exercise) => {
        const key = `${activeWorkoutDay}__${exercise}`
        const values = exerciseInputs[key] || {}

        return {
          exercise,
          weight: Number(values.weight || 0),
          sets: Number(values.sets || 0),
          reps: Number(values.reps || 0),
        }
      })
      .filter((entry) => entry.weight > 0 || entry.sets > 0 || entry.reps > 0)

    if (!validEntries.length) {
      alert("Adj meg legalább egy gyakorlatot a mentéshez.")
      return
    }

    try {
      await Promise.all(
        validEntries.map((entry) =>
          fetch(WORKOUT_API_URL, {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify({
              workoutType: activeWorkoutDay,
              exerciseName: entry.exercise,
              durationMinutes: 45,
              caloriesBurned: 250,
              sets: entry.sets || getTargetSetsForExercise(activeWorkoutDay, entry.exercise),
              reps: entry.reps || 0,
              weightKg: entry.weight || 0,
              notes: "",
              date: getTodayStr(),
            }),
          })
        )
      )

      await loadWorkouts()
      window.dispatchEvent(new Event("storage"))
      window.dispatchEvent(new Event("focus"))
      alert("Edzés sikeresen mentve.")
    } catch {
      alert("Hiba történt az edzés mentése során.")
    }
  }

  async function handleDeleteWorkout(id) {
    if (!authHeaders) return
    if (!window.confirm("Biztosan törlöd ezt az edzést?")) return

    try {
      const response = await fetch(`${WORKOUT_API_URL}/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      })
      const data = await response.json()

      if (!data.success) {
        alert(data.error || "Nem sikerült törölni az edzést.")
        return
      }

      setWorkoutEntries((prev) => prev.filter((entry) => entry.id !== id))
    } catch {
      alert("Hálózati hiba történt az edzés törlése közben.")
    }
  }

  const groupedWorkoutEntries = useMemo(() => {
    const groups = {}

    workoutEntries.forEach((entry) => {
      const key = entry.exerciseName
      if (!groups[key]) groups[key] = []
      groups[key].push(entry)
    })

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    })

    return groups
  }, [workoutEntries])

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    setUser(null)
    setIsProfileOpen(false)
    navigate("/")
  }

  return (
    <div className="test-page">
      <Navbar onOpenProfile={() => setIsProfileOpen(true)} user={user} />

      <main className="test-content">
        <h2>Test</h2>

        <section className="data-input-section">
          <h3>Személyes adatok</h3>

          <div className="form-container">
            <div className="form-group">
              <label htmlFor="age">Életkor:</label>
              <input
                id="age"
                type="number"
                placeholder="pl. 25"
                min="10"
                max="100"
                value={form.age}
                onChange={(e) => setForm((prev) => ({ ...prev, age: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="weight">Súly (kg):</label>
              <input
                id="weight"
                type="number"
                placeholder="pl. 75"
                min="30"
                max="300"
                value={form.weight}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, weight: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="height">Magasság (cm):</label>
              <input
                id="height"
                type="number"
                placeholder="pl. 180"
                min="100"
                max="250"
                value={form.height}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, height: e.target.value }))
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Nem:</label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, gender: e.target.value }))
                }
              >
                <option value="">Válassz...</option>
                <option value="male">Férfi</option>
                <option value="female">Nő</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="activity">Aktivitási szint:</label>
              <select
                id="activity"
                value={form.activity}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, activity: e.target.value }))
                }
              >
                <option value="">Válassz...</option>
                <option value="1.2">Ülő életmód</option>
                <option value="1.375">Könnyű aktivitás (1-3 nap/hét)</option>
                <option value="1.55">Közepes aktivitás (3-5 nap/hét)</option>
                <option value="1.725">Aktív (6-7 nap/hét)</option>
                <option value="1.9">Nagyon aktív (napi 2x edzés)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="goal">Cél:</label>
              <select
                id="goal"
                value={form.goal}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, goal: e.target.value }))
                }
              >
                <option value="">Válassz...</option>
                <option value="deficit">Fogyás</option>
                <option value="maintain">Tartás</option>
                <option value="surplus">Tömegnövelés</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="experience">Edzés tapasztalat:</label>
              <select
                id="experience"
                value={form.experience}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, experience: e.target.value }))
                }
              >
                <option value="">Válassz...</option>
                <option value="beginner">Kezdő (0-1 év)</option>
                <option value="intermediate">Haladó (1-3 év)</option>
                <option value="advanced">Profi (3+ év)</option>
              </select>
            </div>

            <button
              type="button"
              className="btn-calculate"
              onClick={handleGeneratePlan}
              disabled={isGenerating}
            >
              {isGenerating ? "Számítás..." : "Terv Generálása"}
            </button>
          </div>
        </section>

        {results && (
          <section className="result-section">
            <h3>Kalória cél</h3>

            <div className="result-card">
              <p className="result-label">BMR (Alap metabolizmus):</p>
              <p className="result-value">{results.bmr} kcal</p>
            </div>

            <div className="result-card">
              <p className="result-label">TDEE (Napi kalóriaigény):</p>
              <p className="result-value">{results.tdee} kcal</p>
            </div>

            <div className="result-card highlight">
              <p className="result-label">Cél kalória (céloddal):</p>
              <p className="result-value">{results.goalCalories} kcal</p>
            </div>

            <div className="macro-breakdown">
              <h4>Makrók ajánlása:</h4>
              <p>Fehérje: {results.protein} g</p>
              <p>Zsír: {results.fat} g</p>
              <p>Szénhidrát: {results.carbs} g</p>
            </div>
          </section>
        )}

        {availablePlanDays.length > 0 && (
          <section className="training-section">
            <h3>Személyre szabott edzésterv</h3>

            <div className="plan-grid">
              {availablePlanDays.map((day) => (
                <article key={day} className="plan-card">
                  <h4>{day}</h4>
                  <ul>
                    {planStructure[day].map((exercise) => (
                      <li key={exercise}>
                        {exercise} – {getTargetSetsForExercise(day, exercise)} szett
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            {results?.goalAdvice && (
              <p className="goal-advice">{results.goalAdvice}</p>
            )}
          </section>
        )}

        <section className="result-section">
          <h3>Napi kalória számláló</h3>

          <div className="food-form-shell">
            <div className="food-control-row">
              <div className="form-group">
                <label htmlFor="food-search">Étel keresése:</label>
                <input
                  id="food-search"
                  type="text"
                  placeholder="angolul add meg, pl. apple, chicken breast"
                  value={foodQuery}
                  onChange={(e) => setFoodQuery(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="food-grams">Mennyiség (gramm):</label>
                <input
                  id="food-grams"
                  type="number"
                  min="1"
                  placeholder="pl. 150"
                  value={foodGrams}
                  onChange={(e) => setFoodGrams(e.target.value)}
                />
              </div>

              <button type="button" className="btn-calculate btn-add-food" onClick={handleAddFood}>
                Hozzáadás
              </button>
            </div>

            {(foodLoading || foodSearchResults.length > 0 || foodQuery.trim()) && (
              <div className={`food-results ${foodSearchResults.length ? "open" : ""}`}>
                {foodLoading && <div className="food-result-state">Keresés...</div>}

                {!foodLoading && foodQuery.trim() && foodSearchResults.length === 0 && (
                  <div className="food-result-state">
                    Nincs találat a kiválasztott adatbázisban.
                  </div>
                )}

                {foodSearchResults.map((item) => (
                  <button
                    key={item.fdcId}
                    type="button"
                    className={`food-result-item ${selectedFood?.fdcId === item.fdcId ? "selected" : ""
                      }`}
                    onClick={() => {
                      setSelectedFood(item)
                      setFoodQuery(item.description)
                      setFoodSearchResults([])
                    }}
                  >
                    <div className="food-title">
                      <strong>{item.description}</strong>
                      {item.brandOwner ? (
                        <span className="food-brand"> ({item.brandOwner})</span>
                      ) : null}
                    </div>
                    <div className="food-macros100">
                      <small>
                        {item.dataType} • 100g: {Math.round(item.nutrients?.energyKcal || 0)}{" "}
                        kcal • P: {Math.round(item.nutrients?.proteinG || 0)}g • C:{" "}
                        {Math.round(item.nutrients?.carbG || 0)}g
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {foodPreview && (
              <div className="result-card food-preview">
                <div className="macro-grid">
                  <div className="macro-item">
                    <span className="macro-label">Kalória</span>
                    <span className="macro-value">{foodPreview.kcal} kcal</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-label">Fehérje</span>
                    <span className="macro-value">{foodPreview.protein} g</span>
                  </div>
                  <div className="macro-item">
                    <span className="macro-label">Szénhidrát</span>
                    <span className="macro-value">{foodPreview.carbs} g</span>
                  </div>
                  <div className="macro-item macro-note">
                    <span>{foodPreview.description}</span>
                    <span>{foodPreview.grams} g</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="result-card">
            <h4>
              Mai tételek <span className="food-count">({foodEntries.length})</span>
            </h4>

            <div className="food-list">
              {!foodEntries.length ? (
                <p className="no-data">Még nincs hozzáadott étel.</p>
              ) : (
                foodEntries.map((entry) => (
                  <div key={entry.id} className="food-entry">
                    <div className="food-entry-top">
                      <div className="food-entry-title">
                        <span className="food-name">{entry.description}</span>
                        <span className="food-grams-badge">{entry.grams} g</span>
                      </div>

                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDeleteFood(entry.id)}
                        aria-label="Tétel törlése"
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="food-entry-macros">
                      <div className="food-chip">
                        <span className="chip-label">Kalória</span>
                        <span className="chip-value">{entry.energyKcal} kcal</span>
                      </div>
                      <div className="food-chip">
                        <span className="chip-label">Fehérje</span>
                        <span className="chip-value">{entry.proteinG} g</span>
                      </div>
                      <div className="food-chip">
                        <span className="chip-label">Szénhidrát</span>
                        <span className="chip-value">{entry.carbG} g</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="result-card highlight">
            <h4>Összesítés (ma)</h4>
            <p>Kalória: {roundNum(foodTotals.kcal)} kcal</p>
            <p>Fehérje: {roundNum(foodTotals.protein)} g</p>
            <p>Szénhidrát: {roundNum(foodTotals.carbs)} g</p>
          </div>
        </section>

        {availablePlanDays.length > 0 && (
          <section className="tracker-section">
            <h3>Progressive Overload Tracker</h3>
            <p className="tracker-info">
              Add meg a mai edzésed súlyait az alábbi gyakorlatokhoz:
            </p>

            <div className="tracker-day-selector">
              <label htmlFor="active-workout-day">Aktuálisan végzett tervnap:</label>
              <select
                id="active-workout-day"
                value={activeWorkoutDay}
                onChange={(e) => setActiveWorkoutDay(e.target.value)}
              >
                {availablePlanDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="exercise-input-grid">
              {currentDayExercises.map((exercise) => {
                const key = `${activeWorkoutDay}__${exercise}`
                const values = exerciseInputs[key] || {
                  weight: "",
                  sets: "",
                  reps: "",
                }

                return (
                  <div key={exercise} className="exercise-input-item">
                    <label>{exercise}</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Súly (kg)"
                      value={values.weight}
                      onChange={(e) =>
                        handleExerciseInputChange(exercise, "weight", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder={`Szett (${getTargetSetsForExercise(
                        activeWorkoutDay,
                        exercise
                      )})`}
                      value={values.sets}
                      onChange={(e) =>
                        handleExerciseInputChange(exercise, "sets", e.target.value)
                      }
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Ismétlés"
                      value={values.reps}
                      onChange={(e) =>
                        handleExerciseInputChange(exercise, "reps", e.target.value)
                      }
                    />
                  </div>
                )
              })}
            </div>

            <button type="button" className="btn-save-workout" onClick={handleSaveWorkout}>
              Edzés Mentése
            </button>

            <div className="tracker-history">
              <h4>Előrehaladás történet</h4>

              {!Object.keys(groupedWorkoutEntries).length ? (
                <p className="no-data">Még nincs mentett edzés.</p>
              ) : (
                <div className="history-grid">
                  {Object.entries(groupedWorkoutEntries).map(([exercise, entries]) => {
                    const latest = entries[0]
                    const maxWeight = Math.max(
                      ...entries.map((entry) => Number(entry.weightKg || 0))
                    )
                    const latestWeight = Number(latest.weightKg || 0)
                    const latestSets = Number(latest.sets || 0)

                    let improvement = null
                    if (entries.length > 1) {
                      const previousWeight = Number(entries[1].weightKg || 0)
                      if (previousWeight > 0) {
                        improvement = (
                          ((latestWeight - previousWeight) / previousWeight) *
                          100
                        ).toFixed(1)
                      }
                    }

                    return (
                      <article key={exercise} className="history-card">
                        <div className="history-card-head">
                          <h5>{exercise}</h5>
                          <span className="history-best">Legjobb: {maxWeight} kg</span>
                        </div>

                        <div className="history-summary">
                          <span>Legutóbbi: {latestWeight} kg</span>
                          <span>{latestSets} szett</span>
                        </div>

                        <div className="history-entries">
                          {entries.map((entry, index) => {
                            const isLatest = index === 0

                            return (
                              <div
                                key={entry.id}
                                className={`history-row ${isLatest ? "latest" : ""}`}
                              >
                                <div className="history-row-main">
                                  <span className="history-date">
                                    {formatDate(entry.date)}
                                  </span>
                                  <span className="history-metrics">
                                    {entry.weightKg} kg • {entry.sets || 0} szett
                                  </span>

                                  {isLatest && improvement !== null && (
                                    <span
                                      className={`history-delta ${Number(improvement) > 0
                                          ? "up"
                                          : Number(improvement) < 0
                                            ? "down"
                                            : "neutral"
                                        }`}
                                    >
                                      {Number(improvement) > 0
                                        ? `↗ +${improvement}%`
                                        : Number(improvement) < 0
                                          ? `↘ ${improvement}%`
                                          : "→ 0%"}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  className="btn-delete"
                                  onClick={() => handleDeleteWorkout(entry.id)}
                                  title="Bejegyzés törlése"
                                >
                                  Törlés
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        )}

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