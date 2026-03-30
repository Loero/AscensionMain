export function getTodayStr() {
  const now = new Date()
  const pad = (n) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function normalizeDayToken(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*[-]\s*.*/, "")
    .replace(/[()]/g, "")
    .trim()
}

export function doesPlanDayMatchToday(planDayLabel, todayName) {
  if (!planDayLabel || !todayName) return false

  const normalized = normalizeDayToken(planDayLabel)
  const todayNormalized = normalizeDayToken(todayName)

  return normalized
    .split("/")
    .map((part) => part.trim())
    .some((part) => part === todayNormalized)
}

export function getDefaultSetsByExperience(experience) {
  if (experience === "beginner") return 3
  if (experience === "intermediate") return 4
  return 4
}

export function getRequiredWorkoutSetsTodayFromPlan({
  plan,
  dailyWorkoutPlanLabel = "",
  fallbackExperience = "beginner",
}) {
  try {
    const structure = plan?.planStructure || {}
    const setTargets = plan?.setTargets || {}
    const fallbackSets = getDefaultSetsByExperience(
      plan?.experience || fallbackExperience
    )

    const dayNames = Object.keys(structure)
    if (!dayNames.length) return 0

    let selectedDay = ""

    if (dailyWorkoutPlanLabel && structure[dailyWorkoutPlanLabel]) {
      selectedDay = dailyWorkoutPlanLabel
    } else {
      const savedDay = localStorage.getItem("ascension_active_workout_day_v1")
      const savedDayDate = localStorage.getItem("ascension_active_workout_day_date_v1")
      const todayStr = getTodayStr()

      if (savedDay && savedDayDate === todayStr && structure[savedDay]) {
        selectedDay = savedDay
      } else {
        const todayName = new Date().toLocaleDateString("hu-HU", {
          weekday: "long",
        })

        selectedDay =
          dayNames.find((day) => doesPlanDayMatchToday(day, todayName)) || dayNames[0]
      }
    }

    const exercises = Array.isArray(structure[selectedDay]) ? structure[selectedDay] : []
    if (!exercises.length) return 0

    return exercises.reduce((sum, exercise) => {
      const dayTargets = setTargets?.[selectedDay] || {}
      const target = Number(dayTargets?.[exercise] || fallbackSets)
      return sum + (Number.isFinite(target) ? target : fallbackSets)
    }, 0)
  } catch {
    return 0
  }
}

export function getProgressPercent(current, target) {
  const c = Number(current || 0)
  const t = Number(target || 0)
  if (!t || t <= 0) return 0
  return Math.min(100, Math.round((c / t) * 100))
}