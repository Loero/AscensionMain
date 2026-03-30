import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import ProfileModal from "../components/ProfileModal"
import "./Dashboard.css"
import Navbar from "../components/Navbar"
import {
  getProgressPercent,
  getRequiredWorkoutSetsTodayFromPlan,
  getTodayStr,
} from "../utils/workoutProgress"


export default function Dashboard() {
  const WORKOUT_API_URL = "http://localhost:3000/api/workout"
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

  const [workoutStats, setWorkoutStats] = useState({
    dailyWorkoutSets: 0,
    requiredWorkoutSetsToday: 0,
    workoutIntensity: 0,
  })

  useEffect(() => {
    const syncAuthFromStorage = () => {
      try {
        const token = localStorage.getItem("authToken")
        const rawUser = localStorage.getItem("user")

        if (!token || !rawUser) {
          setUser(null)
          return
        }

        const parsedUser = JSON.parse(rawUser)
        setUser(parsedUser || null)
      } catch {
        setUser(null)
      }
    }

    syncAuthFromStorage()

    window.addEventListener("focus", syncAuthFromStorage)
    window.addEventListener("storage", syncAuthFromStorage)

    return () => {
      window.removeEventListener("focus", syncAuthFromStorage)
      window.removeEventListener("storage", syncAuthFromStorage)
    }
  }, [])

  useEffect(() => {
    const loadDashboardWorkoutStats = async () => {
      const token = localStorage.getItem("authToken")
      if (!token) {
        setWorkoutStats({
          dailyWorkoutSets: 0,
          requiredWorkoutSetsToday: 0,
          workoutIntensity: 0,
        })
        return
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }

      try {
        const today = getTodayStr()
        const response = await fetch(
          `${WORKOUT_API_URL}?startDate=${today}&endDate=${today}`,
          {
            method: "GET",
            headers,
          }
        )
        const data = await response.json()

        const todayEntries =
          data.success && Array.isArray(data.entries) ? data.entries : []

        const dailyWorkoutSets = todayEntries.reduce(
          (sum, entry) => sum + Number(entry.sets || 0),
          0
        )

        const savedPlanRaw = localStorage.getItem("ascension_training_plan_v1")
        let requiredWorkoutSetsToday = 0

        if (savedPlanRaw) {
          try {
            const savedPlan = JSON.parse(savedPlanRaw)
            requiredWorkoutSetsToday = getRequiredWorkoutSetsTodayFromPlan({
              plan: savedPlan,
              dailyWorkoutPlanLabel: todayEntries[0]?.workoutType || "",
              fallbackExperience: savedPlan?.experience || "beginner",
            })
          } catch {
            requiredWorkoutSetsToday = 0
          }
        }

        const workoutIntensity = getProgressPercent(
          dailyWorkoutSets,
          requiredWorkoutSetsToday
        )

        setWorkoutStats({
          dailyWorkoutSets,
          requiredWorkoutSetsToday,
          workoutIntensity,
        })
      } catch {
        setWorkoutStats({
          dailyWorkoutSets: 0,
          requiredWorkoutSetsToday: 0,
          workoutIntensity: 0,
        })
      }
    }

    loadDashboardWorkoutStats()

    window.addEventListener("focus", loadDashboardWorkoutStats)
    window.addEventListener("storage", loadDashboardWorkoutStats)

    return () => {
      window.removeEventListener("focus", loadDashboardWorkoutStats)
      window.removeEventListener("storage", loadDashboardWorkoutStats)
    }
  }, [])

  const [animatedStats, setAnimatedStats] = useState({
    daysInSystem: 0,
    pslGrowth: 0,
    dailyCompletion: 0,
  })

  const dashboardData = useMemo(() => {
    const today = new Date()
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null

    const daysInSystem =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? Math.max(
          0,
          Math.floor((today.getTime() - createdAt.getTime()) / 86400000)
        )
        : 0

    const workoutProgress = workoutStats.workoutIntensity
    const workoutDone = workoutStats.dailyWorkoutSets > 0

    const tasks = [
      {
        id: "test",
        title: "Edzés",
        description: workoutDone
          ? `Mai haladás: ${workoutStats.dailyWorkoutSets}/${workoutStats.requiredWorkoutSetsToday} szett`
          : "Ma nincs edzés teljesítve. Rögzítsd a napi edzésedet.",
        buttonText: workoutDone ? "Edzés Folytatása" : "Edzés Beállítása",
        progress: workoutProgress,
        route: "/test",
      },
      {
        id: "arc",
        title: "Arcápolás",
        description:
          "Rutin nincs beállítva. Készítsd el a személyre szabott arcápolási rutinodat.",
        buttonText: "Rutin Készítése",
        progress: 0,
        route: "/arc",
      },
      {
        id: "mental",
        title: "Mentális",
        description:
          "Nincs mentális gyakorlat. Válassz egy meditációt vagy relaxációs technikát.",
        buttonText: "Gyakorlat Választása",
        progress: 0,
        route: "/mental",
      },
    ]

    const completedTasks = tasks.filter((task) => task.progress >= 100).length
    const dailyPercent = Math.round((completedTasks / tasks.length) * 100)

    return {
      daysInSystem,
      pslGrowth: workoutProgress >= 100 ? 1 : 0,
      dailyCompletion: dailyPercent,
      completedTasks,
      tasks,
    }
  }, [user, workoutStats])

  useEffect(() => {
    const target = {
      daysInSystem: dashboardData.daysInSystem,
      pslGrowth: dashboardData.pslGrowth,
      dailyCompletion: dashboardData.dailyCompletion,
    }

    let frame
    let start

    const duration = 800

    const animate = (timestamp) => {
      if (!start) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)

      setAnimatedStats({
        daysInSystem: Math.round(target.daysInSystem * progress),
        pslGrowth: Number((target.pslGrowth * progress).toFixed(1)),
        dailyCompletion: Math.round(target.dailyCompletion * progress),
      })

      if (progress < 1) {
        frame = requestAnimationFrame(animate)
      }
    }

    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [dashboardData.daysInSystem, dashboardData.pslGrowth, dashboardData.dailyCompletion])

  const handleTaskNavigation = (route) => {
    if (!user) {
      navigate("/")
      return
    }

    navigate(route)
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    setUser(null)
    setIsProfileOpen(false)
    navigate("/")
  }

  return (
    <div className="dashboard-page">
      <Navbar onOpenProfile={() => setIsProfileOpen(true)} user={user} />

      <main className="dashboard-container">
        <section className="hero-section">
          <h1 className="hero-title">Ascension System</h1>
          <p className="hero-subtitle">
            Üdvözölünk a fejlődési rendszeredben. Kövesd a haladásodat és
            teljesítsd a napi feladatokat.
          </p>
          <div className="hero-divider"></div>

          <div className="daily-progress-container">
            <div className="daily-progress-label">
              Napi haladás – {dashboardData.completedTasks}/3 teljesítve (
              {dashboardData.dailyCompletion}%)
            </div>
            <div className="daily-progress">
              <div
                className="daily-progress-fill"
                style={{ width: `${dashboardData.dailyCompletion}%` }}
              ></div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="stats-grid">
            <div className="card stat-card">
              <div className="stat-content">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <div className="stat-label">Nap a rendszerben</div>
                  <div className="stat-value">{animatedStats.daysInSystem}</div>
                  <div className="stat-change">+0 ma</div>
                </div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-content">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <div className="stat-label">PSL növekedés</div>
                  <div className="stat-value">
                    {animatedStats.pslGrowth.toFixed(1)}
                  </div>
                  <div className="stat-change">+0.0%</div>
                </div>
              </div>
            </div>

            <div className="card stat-card">
              <div className="stat-content">
                <div className="stat-icon"></div>
                <div className="stat-info">
                  <div className="stat-label">Napi kitöltés</div>
                  <div className="stat-value">
                    {animatedStats.dailyCompletion}%
                  </div>
                  <div className="stat-change">
                    {dashboardData.completedTasks}/3 feladat
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="separator"></div>

        <section className="tasks-section">
          <div className="section-header">
            <h2 className="section-title">Mai feladatok</h2>
            <p className="section-subtitle">
              Teljesítsd a napi céljaid a folyamatos fejlődésért
            </p>
          </div>

          <div className="tasks-grid">
            {dashboardData.tasks.map((task) => (
              <div className="card task-card" key={task.id}>
                <div className="task-header">
                  <div className="task-icon"></div>
                  <div>
                    <h3 className="task-title">{task.title}</h3>
                  </div>
                </div>

                <p className="task-description">{task.description}</p>

                <div className="task-progress">
                  <div className="task-progress-bar">
                    <div
                      className="task-progress-fill"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  </div>
                  <div className="task-progress-text">
                    {task.progress}% teljesítve
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => handleTaskNavigation(task.route)}
                >
                  {task.buttonText}
                </button>
              </div>
            ))}
          </div>
        </section>
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