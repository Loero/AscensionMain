import { useEffect, useMemo, useState } from "react"
import {
    getProgressPercent,
    getRequiredWorkoutSetsTodayFromPlan,
} from "../utils/workoutProgress"

const PROFILE_API_URL = "http://localhost:3000/api/profile"
const SKIN_ROUTINE_API_URL = "http://localhost:3000/api/skin/routine"
const FOOD_ENTRIES_API_URL = "http://localhost:3000/api/food/entries"
const WORKOUT_API_URL = "http://localhost:3000/api/workout"

export default function ProfileModal({
    isOpen,
    onClose,
    onLogout,
    user,
    onUserRefresh,
}) {
    const [loading, setLoading] = useState(false)
    const [profileError, setProfileError] = useState("")
    const [activeMode, setActiveMode] = useState("stats")

    const [profileUser, setProfileUser] = useState(user)
    const [personal, setPersonal] = useState(null)

    const [dailyCalories, setDailyCalories] = useState(0)
    const [dailyProtein, setDailyProtein] = useState(0)
    const [dailyCarbs, setDailyCarbs] = useState(0)
    const [dailyFat, setDailyFat] = useState(0)
    const [dailyFoodEntries, setDailyFoodEntries] = useState([])

    const [dailyWorkoutMinutes, setDailyWorkoutMinutes] = useState(0)
    const [dailyWorkoutEntries, setDailyWorkoutEntries] = useState(0)
    const [dailyWorkoutSets, setDailyWorkoutSets] = useState(0)
    const [dailyWorkoutPlanLabel, setDailyWorkoutPlanLabel] = useState("")
    const [totalWorkoutEntriesComputed, setTotalWorkoutEntriesComputed] = useState(0)
    const [totalWorkoutSetsComputed, setTotalWorkoutSetsComputed] = useState(0)
    const [requiredWorkoutSetsToday, setRequiredWorkoutSetsToday] = useState(0)

    const [skinRoutineData, setSkinRoutineData] = useState(null)
    const [requiredSkinSteps, setRequiredSkinSteps] = useState(0)
    const [completedSkinSteps, setCompletedSkinSteps] = useState(0)
    const [skinIntensity, setSkinIntensity] = useState(0)

    useEffect(() => {
        setProfileUser(user)
    }, [user])

    useEffect(() => {
        if (!isOpen) return

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose()
        }

        document.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, onClose])

    useEffect(() => {
        if (!isOpen) return

        let intervalId = null
        let lastDateKey = getTodayStr()

        fetchProfileData()

        intervalId = setInterval(() => {
            const currentDateKey = getTodayStr()
            if (currentDateKey !== lastDateKey) {
                lastDateKey = currentDateKey
                fetchProfileData()
            }
        }, 30000)

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [isOpen])

    const getTodayStr = () => {
        const now = new Date()
        const pad = (n) => String(n).padStart(2, "0")
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    }

    const getAuthHeaders = () => {
        const token = localStorage.getItem("authToken")
        if (!token) return null

        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    }

    const formatDate = (value) => {
        if (!value) return "—"
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return "—"

        return date.toLocaleDateString("hu-HU", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
    }

    const formatShortDate = (value) => {
        if (!value) return "—"
        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return "—"

        return date.toLocaleDateString("hu-HU", {
            month: "short",
            day: "numeric",
        })
    }

    const mapGoal = (goal) => {
        if (!goal) return "—"
        if (goal === "deficit") return "Fogyás"
        if (goal === "maintain") return "Súlytartás"
        if (goal === "surplus") return "Tömegnövelés"
        return goal
    }

    const mapExperience = (exp) => {
        if (!exp) return "—"
        if (exp === "beginner") return "Kezdő"
        if (exp === "intermediate") return "Középhaladó"
        if (exp === "advanced") return "Haladó"
        return exp
    }

    const mapActivity = (mult) => {
        const m = Number(mult)
        if (!m) return "—"
        if (m === 1.2) return "Ülő életmód"
        if (m === 1.375) return "Könnyű aktivitás"
        if (m === 1.55) return "Közepes aktivitás"
        if (m === 1.725) return "Aktív"
        if (m === 1.9) return "Nagyon aktív"
        return `Aktivitási szorzó: ${m}`
    }

    const getWorkoutFocusLabel = (planDayLabel) => {
        if (!planDayLabel) return "Nincs kiválasztott tervnap"
        const parts = String(planDayLabel).split("-")
        if (parts.length > 1) return parts.slice(1).join("-").trim()
        return planDayLabel
    }

    const stripSkinStepLabel = (value) =>
        String(value || "")
            .replace(/[^a-zA-Z0-9\s.,:()\-+/%áéíóöőúüűÁÉÍÓÖŐÚÜŰ]/g, "")
            .replace(/\s+/g, " ")
            .trim()

    const getRequiredSkinStepsFromRoutine = (routine) => {
        const pickTopThree = (list) =>
            (Array.isArray(list) ? list : [])
                .map((step) => stripSkinStepLabel(step))
                .filter(Boolean)
                .slice(0, 3)

        return [
            ...pickTopThree(routine?.morning_routine),
            ...pickTopThree(routine?.evening_routine),
        ]
    }

    const nutritionTargets = useMemo(() => {
        const age = Number(personal?.age || 0)
        const weight = Number(personal?.weightKg || 0)
        const height = Number(personal?.heightCm || 0)
        const gender = personal?.gender
        const activity = Number(personal?.activityMultiplier || 0)
        const goal = personal?.goal

        if (!age || !weight || !height || !gender || !activity || !goal) {
            return { calories: 0, protein: 0, carbs: 0, fat: 0 }
        }

        const bmr =
            gender === "male"
                ? 10 * weight + 6.25 * height - 5 * age + 5
                : 10 * weight + 6.25 * height - 5 * age - 161

        let targetCalories = bmr * activity
        if (goal === "deficit") targetCalories -= 400
        if (goal === "surplus") targetCalories += 300
        if (targetCalories < 1200) targetCalories = 1200

        const protein = Math.round(weight * 2)
        const fat = Math.round(((targetCalories * 0.25) / 9) * 10) / 10
        const carbs =
            Math.round(((targetCalories - protein * 4 - fat * 9) / 4) * 10) / 10

        return {
            calories: Math.round(targetCalories),
            protein,
            carbs: Math.max(0, carbs),
            fat: Math.max(0, fat),
        }
    }, [personal])

    const calorieIntensity = getProgressPercent(dailyCalories, nutritionTargets.calories)
    const proteinIntensity = getProgressPercent(dailyProtein, nutritionTargets.protein)
    const carbsIntensity = getProgressPercent(dailyCarbs, nutritionTargets.carbs)
    const fatIntensity = getProgressPercent(dailyFat, nutritionTargets.fat)
    const workoutIntensity = getProgressPercent(dailyWorkoutSets, requiredWorkoutSetsToday)

    const fetchProfileData = async () => {
        const headers = getAuthHeaders()

        if (!headers) {
            setProfileError("Nincs bejelentkezve.")
            return
        }

        setLoading(true)
        setProfileError("")

        try {
            const profileResponse = await fetch(PROFILE_API_URL, {
                method: "GET",
                headers,
            })
            const profileData = await profileResponse.json()

            if (!profileResponse.ok || !profileData.success) {
                setProfileError(profileData.error || "Profil betöltése sikertelen.")
                return
            }

            const profile = profileData.profile || {}
            const fetchedUser = profile.user || profileData.user || user || null

            setProfileUser(fetchedUser)

            let personalData = profile.personal || null

            if (!personalData) {
                try {
                    const raw = localStorage.getItem("ascension_personal_v1")
                    if (raw) {
                        const parsed = JSON.parse(raw)
                        personalData = {
                            age: parsed.age,
                            weightKg: parsed.weight,
                            heightCm: parsed.height,
                            gender: parsed.gender,
                            activityMultiplier: parsed.activity,
                            goal: parsed.goal,
                            experience: parsed.experience,
                        }
                    }
                } catch { }
            }

            setPersonal(personalData)

            if (fetchedUser) {
                localStorage.setItem("user", JSON.stringify(fetchedUser))
                onUserRefresh?.(fetchedUser)
            }

            const todayStr = getTodayStr()

            await Promise.all([
                fetchFoodStats(headers, todayStr),
                fetchWorkoutStats(headers, todayStr, personalData),
                fetchSkinStats(headers, todayStr),
            ])
        } catch {
            setProfileError("Nem sikerült betölteni a profilt.")
        } finally {
            setLoading(false)
        }
    }

    const fetchFoodStats = async (headers, todayStr) => {
        try {
            const res = await fetch(`${FOOD_ENTRIES_API_URL}?date=${todayStr}`, {
                method: "GET",
                headers,
            })
            const data = await res.json()

            if (!data.success || !Array.isArray(data.entries)) {
                setDailyCalories(0)
                setDailyProtein(0)
                setDailyCarbs(0)
                setDailyFat(0)
                setDailyFoodEntries([])
                return
            }

            setDailyCalories(
                data.entries.reduce((sum, entry) => sum + Number(entry.calories || 0), 0)
            )
            setDailyProtein(
                data.entries.reduce((sum, entry) => sum + Number(entry.protein_g || 0), 0)
            )
            setDailyCarbs(
                data.entries.reduce((sum, entry) => sum + Number(entry.carbs_g || 0), 0)
            )
            setDailyFat(
                data.entries.reduce((sum, entry) => sum + Number(entry.fat_g || 0), 0)
            )

            setDailyFoodEntries(
                data.entries.map((entry) => ({
                    id: entry.id,
                    foodName: entry.food_name,
                    grams: entry.grams,
                    calories: entry.calories,
                    proteinG: entry.protein_g,
                    carbsG: entry.carbs_g,
                    fatG: entry.fat_g,
                    date: entry.date,
                    createdAt: entry.created_at,
                }))
            )
        } catch {
            setDailyFoodEntries([])
        }
    }

    const fetchWorkoutStats = async (headers, todayStr, personalData) => {
        try {
            // 🔹 1. Mai edzések lekérése
            const dayRes = await fetch(
                `${WORKOUT_API_URL}?startDate=${todayStr}&endDate=${todayStr}`,
                { method: "GET", headers }
            )
            const dayData = await dayRes.json()

            let todayEntries = []
            if (dayData.success && Array.isArray(dayData.entries)) {
                todayEntries = dayData.entries
            }

            const todaySets = todayEntries.reduce(
                (sum, entry) => sum + Number(entry.sets || 0),
                0
            )

            const todayMinutes = todayEntries.reduce(
                (sum, entry) => sum + Number(entry.durationMinutes || 0),
                0
            )

            setDailyWorkoutEntries(todayEntries.length)
            setDailyWorkoutSets(todaySets)
            setDailyWorkoutMinutes(todayMinutes)
            setDailyWorkoutPlanLabel(todayEntries[0]?.workoutType || "")

            // 🔹 2. ÖSSZES edzés (history stat)
            const allRes = await fetch(WORKOUT_API_URL, {
                method: "GET",
                headers,
            })
            const allData = await allRes.json()

            if (allData.success && Array.isArray(allData.entries)) {
                setTotalWorkoutEntriesComputed(allData.entries.length)
                setTotalWorkoutSetsComputed(
                    allData.entries.reduce(
                        (sum, entry) => sum + Number(entry.sets || 0),
                        0
                    )
                )
            } else {
                setTotalWorkoutEntriesComputed(0)
                setTotalWorkoutSetsComputed(0)
            }

            // 🔹 3. 👉 EZ A LÉNYEG: napi CÉL szettek számítása a tervből
            let requiredSets = 0

            const savedPlanRaw = localStorage.getItem("ascension_training_plan_v1")

            if (savedPlanRaw) {
                try {
                    const savedPlan = JSON.parse(savedPlanRaw)

                    requiredSets = getRequiredWorkoutSetsTodayFromPlan({
                        plan: savedPlan,
                        dailyWorkoutPlanLabel: todayEntries[0]?.workoutType || "",
                        fallbackExperience: personalData?.experience || "beginner",
                    })
                } catch {
                    requiredSets = 0
                }
            }

            setRequiredWorkoutSetsToday(requiredSets)
        } catch {
            setDailyWorkoutEntries(0)
            setDailyWorkoutSets(0)
            setDailyWorkoutMinutes(0)
            setDailyWorkoutPlanLabel("")
            setTotalWorkoutEntriesComputed(0)
            setTotalWorkoutSetsComputed(0)
            setRequiredWorkoutSetsToday(0)
        }
    }

    const fetchSkinStats = async (headers, todayStr) => {
        try {
            const routineRes = await fetch(SKIN_ROUTINE_API_URL, {
                method: "GET",
                headers,
            })
            const routineData = await routineRes.json()

            if (!routineData.success || !routineData.routine) {
                setSkinRoutineData(null)
                setRequiredSkinSteps(0)
                setCompletedSkinSteps(0)
                setSkinIntensity(0)
                return
            }

            const routine = routineData.routine
            setSkinRoutineData(routine)

            const requiredSteps = getRequiredSkinStepsFromRoutine(routine)
            const requiredCount = requiredSteps.length
            setRequiredSkinSteps(requiredCount)

            let completedCount = 0

            try {
                const trackingRes = await fetch(
                    `http://localhost:3000/api/skin/tracking?routine_id=${encodeURIComponent(
                        routine.id
                    )}&date=${encodeURIComponent(todayStr)}`,
                    { method: "GET", headers }
                )
                const trackingData = await trackingRes.json()

                if (trackingData.success && trackingData.tracking) {
                    const done = [
                        ...(Array.isArray(trackingData.tracking.morning_steps)
                            ? trackingData.tracking.morning_steps
                            : []),
                        ...(Array.isArray(trackingData.tracking.evening_steps)
                            ? trackingData.tracking.evening_steps
                            : []),
                    ].map(stripSkinStepLabel)

                    completedCount = requiredSteps.filter((step) => done.includes(step)).length
                }
            } catch { }

            completedCount = Math.min(requiredCount, Math.max(0, completedCount))
            setCompletedSkinSteps(completedCount)
            setSkinIntensity(
                requiredCount > 0 ? Math.min(100, Math.round((completedCount / requiredCount) * 100)) : 0
            )
        } catch {
            setSkinRoutineData(null)
            setRequiredSkinSteps(0)
            setCompletedSkinSteps(0)
            setSkinIntensity(0)
        }
    }

    const handleResetWorkoutStats = async () => {
        if (!window.confirm("Biztosan törölni szeretnéd az összes edzés bejegyzést?")) {
            return
        }

        try {
            const token = localStorage.getItem("authToken")
            if (!token) {
                alert("Bejelentkezés szükséges.")
                return
            }

            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            }

            const response = await fetch(WORKOUT_API_URL, {
                method: "DELETE",
                headers,
            })

            if (!response.ok) {
                throw new Error("A reset nem sikerült.")
            }

            localStorage.removeItem("ascension_workouts_v1")
            await fetchProfileData()
        } catch (error) {
            alert(error.message || "Hiba történt a reset közben.")
        }
    }

    if (!isOpen) return null

    return (
        <div className="auth-modal active" onClick={onClose}>
            <div
                className="auth-modal-content profile-modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="auth-close profile-close"
                    aria-label="Bezárás"
                    onClick={onClose}
                >
                    &times;
                </button>

                <h2
                    style={{
                        textAlign: "center",
                        marginBottom: "30px",
                        fontFamily: '"Cinzel", serif',
                        color: "#f5f5f5",
                    }}
                >
                    Profilom
                </h2>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#bdbdbd" }}>
                        <p>⏳ Profil adatok betöltése...</p>
                    </div>
                ) : profileError ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#ff6a6a" }}>
                        <p>{profileError}</p>
                    </div>
                ) : (
                    <>
                        <div className="profile-tabs">
                            <button
                                type="button"
                                className={`profile-mode-btn ${activeMode === "stats" ? "active" : ""}`}
                                onClick={() => setActiveMode("stats")}
                            >
                                Statisztikák
                            </button>
                            <button
                                type="button"
                                className={`profile-mode-btn ${activeMode === "data" ? "active" : ""}`}
                                onClick={() => setActiveMode("data")}
                            >
                                Adatok
                            </button>
                        </div>

                        {activeMode === "stats" ? (
                            <div id="profile-content">
                                <div className="profile-section profile-section-cyber">
                                    <h3>🍎 Kalória számláló statisztikák</h3>

                                    <div className="profile-kpi-grid">
                                        <article className="profile-kpi-card profile-kpi-primary profile-kpi-wide">
                                            <div className="kpi-badge">Napi kalória cél</div>
                                            <div className="kpi-title">NAPI KALÓRIA CÉL</div>
                                            <div className="kpi-main">
                                                {Math.round(dailyCalories)} <span>KCAL</span>
                                            </div>
                                            <div className="kpi-progress-explainer">
                                                Teljesítve: {Math.round(dailyCalories)} / {Math.round(nutritionTargets.calories)} kcal ({calorieIntensity}%)
                                            </div>
                                            <div className="kpi-track nutrition-main-track">
                                                <span style={{ width: `${calorieIntensity}%` }} />
                                            </div>

                                            <div className="nutrition-macro-list">
                                                <div className="nutrition-macro-row">
                                                    <div className="nutrition-macro-text">
                                                        Fehérje: {Math.round(dailyProtein)} / {Math.round(nutritionTargets.protein)} g
                                                    </div>
                                                    <div className="kpi-track nutrition-macro-track">
                                                        <span style={{ width: `${proteinIntensity}%` }} />
                                                    </div>
                                                </div>

                                                <div className="nutrition-macro-row">
                                                    <div className="nutrition-macro-text">
                                                        Szénhidrát: {Math.round(dailyCarbs)} / {Math.round(nutritionTargets.carbs)} g
                                                    </div>
                                                    <div className="kpi-track nutrition-macro-track">
                                                        <span style={{ width: `${carbsIntensity}%` }} />
                                                    </div>
                                                </div>

                                                <div className="nutrition-macro-row">
                                                    <div className="nutrition-macro-text">
                                                        Zsír: {Math.round(dailyFat)} / {Math.round(nutritionTargets.fat)} g
                                                    </div>
                                                    <div className="kpi-track nutrition-macro-track">
                                                        <span style={{ width: `${fatIntensity}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    </div>

                                    <div className="profile-subsection-divider">
                                        <h4 className="profile-subheading">Mai bevitt ételek</h4>

                                        {dailyFoodEntries.length === 0 ? (
                                            <div className="profile-empty-state">
                                                <p>Még nincsenek mai étel bejegyzések.</p>
                                            </div>
                                        ) : (
                                            <div className="entries-list">
                                                {dailyFoodEntries.map((entry) => (
                                                    <div className="entry-item" key={entry.id}>
                                                        <div className="entry-header">
                                                            <span className="entry-type">🥗 {entry.foodName}</span>
                                                            <span className="entry-date">
                                                                {formatShortDate(entry.date || entry.createdAt)}
                                                            </span>
                                                        </div>
                                                        <div className="entry-details">
                                                            <span>{entry.grams}g</span>
                                                            <span>{Math.round(entry.calories)} kcal</span>
                                                            <span>F: {Number(entry.proteinG || 0).toFixed(1)}g</span>
                                                            <span>SH: {Number(entry.carbsG || 0).toFixed(1)}g</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="profile-section profile-section-cyber">
                                    <div className="profile-section-head">
                                        <h3>🏋️ Edzés statisztikák</h3>
                                        <button
                                            type="button"
                                            className="profile-reset-btn"
                                            onClick={handleResetWorkoutStats}
                                        >
                                            Statisztika visszaállítása
                                        </button>
                                    </div>

                                    <div className="profile-kpi-grid profile-kpi-grid-two">
                                        <article className="profile-kpi-card profile-kpi-primary">
                                            <div className="kpi-badge">MA</div>
                                            <div className="kpi-title">
                                                Mai edzés: {getWorkoutFocusLabel(dailyWorkoutPlanLabel)}
                                            </div>
                                            <div className="kpi-main">
                                                {Math.round(dailyWorkoutSets)} <span>SZETT</span>
                                            </div>
                                            <div className="kpi-sub">
                                                Teljesítve: {Math.round(dailyWorkoutSets)} / {Math.round(requiredWorkoutSetsToday)} szett
                                            </div>
                                            <div className="kpi-track">
                                                <span style={{ width: `${workoutIntensity}%` }} />
                                            </div>
                                        </article>

                                        <article className="profile-kpi-card">
                                            <div className="kpi-badge">ÖSSZESEN</div>
                                            <div className="kpi-title">Összes szett</div>
                                            <div className="kpi-main">
                                                {Math.round(totalWorkoutSetsComputed)} <span>SZETT</span>
                                            </div>
                                            <div className="kpi-mini">
                                                <p>{Math.round(totalWorkoutEntriesComputed)} edzés bejegyzés</p>
                                            </div>
                                        </article>
                                    </div>
                                </div>

                                <div className="profile-section profile-section-cyber">
                                    <h3>🧴 Arcápolás statisztikák</h3>

                                    <div className="profile-kpi-grid profile-kpi-grid-two">
                                        <article className="profile-kpi-card profile-kpi-primary">
                                            <div className="kpi-badge">MA</div>
                                            <div className="kpi-title">Napi arc cél teljesítés</div>
                                            <div className="kpi-main">
                                                {Math.round(completedSkinSteps)} <span>/ {Math.round(requiredSkinSteps)}</span>
                                            </div>
                                            <div className="kpi-sub">
                                                Teljesítve: {Math.round(completedSkinSteps)} / {Math.round(requiredSkinSteps)} lépés
                                            </div>
                                            <div className="kpi-track">
                                                <span style={{ width: `${Math.round(skinIntensity)}%` }} />
                                            </div>
                                        </article>

                                        <article className="profile-kpi-card">
                                            <div className="kpi-badge">ÁLLAPOT</div>
                                            <div className="kpi-title">Mai arc haladás</div>
                                            <div className="kpi-main">
                                                {Math.round(skinIntensity)} <span>%</span>
                                            </div>
                                            <div className="kpi-mini">
                                                <p>{skinRoutineData ? "Mentett rutin alapján" : "Nincs mentett arc rutin"}</p>
                                            </div>
                                        </article>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div id="profile-content">
                                <div className="profile-section profile-section-cyber">
                                    <h3>📋 Személyes adatok (Tervhez)</h3>

                                    <div className="profile-data-list">
                                        <div className="profile-data-row">
                                            <span className="profile-data-label">Életkor:</span>
                                            <span className="profile-data-value">
                                                {personal?.age ? `${personal.age} év` : "– nincs megadva –"}
                                            </span>
                                        </div>

                                        <div className="profile-data-row">
                                            <span className="profile-data-label">Súly:</span>
                                            <span className="profile-data-value">
                                                {personal?.weightKg ? `${personal.weightKg} kg` : "– nincs megadva –"}
                                            </span>
                                        </div>

                                        <div className="profile-data-row">
                                            <span className="profile-data-label">Magasság:</span>
                                            <span className="profile-data-value">
                                                {personal?.heightCm ? `${personal.heightCm} cm` : "– nincs megadva –"}
                                            </span>
                                        </div>

                                        <div className="profile-data-row">
                                            <span className="profile-data-label">Nem:</span>
                                            <span className="profile-data-value">
                                                {personal?.gender === "male"
                                                    ? "Férfi"
                                                    : personal?.gender === "female"
                                                        ? "Nő"
                                                        : "– nincs megadva –"}
                                            </span>
                                        </div>

                                        <div className="profile-data-row">
                                            <span className="profile-data-label">Aktivitás:</span>
                                            <span className="profile-data-value">
                                                {mapActivity(personal?.activityMultiplier) || "– nincs megadva –"}
                                            </span>
                                        </div>

                                        <div className="profile-data-row">
                                            <span className="profile-data-label">Cél:</span>
                                            <span className="profile-data-value">
                                                {mapGoal(personal?.goal)}
                                            </span>
                                        </div>

                                        <div className="profile-data-row">
                                            <span className="profile-data-label">Edzés tapasztalat:</span>
                                            <span className="profile-data-value">
                                                {mapExperience(personal?.experience)}
                                            </span>
                                        </div>
                                    </div>

                                    <p className="profile-data-note">
                                        Ezek az adatok a Test oldalon megadott űrlap alapján kerülnek mentésre.
                                    </p>
                                </div>

                                <div className="profile-section profile-section-cyber">
                                    <h3>💪 Generált edzésterv</h3>

                                    {dailyWorkoutPlanLabel ? (
                                        <div className="profile-plan-box">
                                            <p className="profile-plan-main">{dailyWorkoutPlanLabel}</p>
                                            <p className="profile-plan-sub">
                                                Mai kiválasztott / aktív tervnap
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="profile-empty-state left">
                                            <p>Még nincs generált edzésterv.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="profile-section profile-section-cyber">
                                    <h3>🧴 Bőrápolási rutin</h3>

                                    {skinRoutineData ? (
                                        <div className="profile-routine-box">
                                            <div className="profile-routine-columns">
                                                <div className="profile-routine-column">
                                                    <h4>Reggeli rutin</h4>
                                                    <ul>
                                                        {(skinRoutineData?.morning_routine || []).map((step, index) => (
                                                            <li key={`morning-${index}`}>{step}</li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div className="profile-routine-column">
                                                    <h4>Esti rutin</h4>
                                                    <ul>
                                                        {(skinRoutineData?.evening_routine || []).map((step, index) => (
                                                            <li key={`evening-${index}`}>{step}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="profile-empty-state">
                                            <p>Még nincs mentett bőrápolási rutinod.</p>
                                            <button
                                                type="button"
                                                className="profile-action-btn"
                                                onClick={() => {
                                                    window.location.href = "/arc"
                                                }}
                                            >
                                                🧪 Rutin készítése
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="profile-section profile-section-danger">
                                    <button
                                        type="button"
                                        className="profile-danger-btn"
                                        onClick={() => {
                                            const confirmed = window.confirm(
                                                "Biztosan törölni szeretnéd a mentett személyes adatokat és edzéstervet?"
                                            )

                                            if (!confirmed) return

                                            localStorage.removeItem("ascension_personal_v1")
                                            localStorage.removeItem("ascension_training_plan_v1")
                                            localStorage.removeItem("ascension_active_workout_day_v1")
                                            localStorage.removeItem("ascension_active_workout_day_date_v1")

                                            setPersonal(null)
                                            setDailyWorkoutPlanLabel("")
                                            setRequiredWorkoutSetsToday(0)
                                            setDailyWorkoutSets(0)
                                            setDailyWorkoutEntries(0)
                                            setDailyWorkoutMinutes(0)
                                            setTotalWorkoutEntriesComputed(0)
                                            setTotalWorkoutSetsComputed(0)
                                        }}
                                    >
                                        🗑️ Adatok törlése és újrakezdés
                                    </button>

                                    <p className="profile-danger-note">
                                        Ez törli az összes mentett személyes adatot és edzéstervedet. Új adatok
                                        megadása után újra létre kell generálnod az edzéstervet.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                <button className="logout-btn" onClick={onLogout}>
                    Kijelentkezés
                </button>
            </div>
        </div>
    )
}