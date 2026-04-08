import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileModal from "../components/ProfileModal";
import "./Dashboard.css";
import Navbar from "../components/Navbar";
import {
  getProgressPercent,
  getRequiredWorkoutSetsTodayFromPlan,
  getTodayStr,
} from "../utils/workoutProgress";
import { useAlert } from "../components/AlertContext";

const DAILY_QUEST_REWARD_PREFIX = "ascension_daily_quest_rewarded_v1";
const DAILY_QUEST_MESSAGES = [
  "Csak így tovább! A következetesség a legerősebb szupererőd.",
  "Szép munka! Ma is bizonyítottad, hogy képes vagy végigcsinálni.",
  "Brutál teljesítmény! Tartsd ezt a tempót holnap is.",
  "Fegyelem szintlépés! Ne állj meg, építsd tovább a szériát.",
];

export default function Dashboard() {
  const WORKOUT_API_URL = "http://localhost:3000/api/workout";
  const SKIN_ROUTINE_API_URL = "http://localhost:3000/api/skin/routine";
  const SKIN_TRACKING_API_URL = "http://localhost:3000/api/skin/tracking";
  const MENTAL_ROUTINE_API_URL = "http://localhost:3000/api/mental/routine";
  const MENTAL_TRACKING_API_URL = "http://localhost:3000/api/mental/tracking";

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

  const [workoutStats, setWorkoutStats] = useState({
    dailyWorkoutSets: 0,
    requiredWorkoutSetsToday: 0,
    workoutIntensity: 0,
  });

  const [skinStats, setSkinStats] = useState({
    hasRoutine: false,
    completedSteps: 0,
    requiredSteps: 0,
    progress: 0,
  });

  const [mentalStats, setMentalStats] = useState({
    hasRoutine: false,
    completedTasks: 0,
    requiredTasks: 0,
    progress: 0,
  });

  const getSkinRequiredStepsCount = (routine) => {
    const morningCount = Array.isArray(routine?.morning_routine)
      ? routine.morning_routine.slice(0, 3).filter(Boolean).length
      : 0;

    const eveningCount = Array.isArray(routine?.evening_routine)
      ? routine.evening_routine.slice(0, 3).filter(Boolean).length
      : 0;

    return morningCount + eveningCount;
  };

  useEffect(() => {
    const syncAuthFromStorage = () => {
      try {
        const token = localStorage.getItem("authToken");
        const rawUser = localStorage.getItem("user");

        if (!token || !rawUser) {
          setUser(null);
          return;
        }

        const parsedUser = JSON.parse(rawUser);
        setUser(parsedUser || null);
      } catch {
        setUser(null);
      }
    };

    syncAuthFromStorage();

    window.addEventListener("focus", syncAuthFromStorage);
    window.addEventListener("storage", syncAuthFromStorage);

    return () => {
      window.removeEventListener("focus", syncAuthFromStorage);
      window.removeEventListener("storage", syncAuthFromStorage);
    };
  }, []);

  useEffect(() => {
    const loadDashboardMentalStats = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setMentalStats({
          hasRoutine: false,
          completedTasks: 0,
          requiredTasks: 0,
          progress: 0,
        });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const today = getTodayStr();

        const routineResponse = await fetch(MENTAL_ROUTINE_API_URL, {
          method: "GET",
          headers,
        });
        const routineData = await routineResponse.json();

        if (!routineData.success || !routineData.routine) {
          setMentalStats({
            hasRoutine: false,
            completedTasks: 0,
            requiredTasks: 0,
            progress: 0,
          });
          return;
        }

        const routine = routineData.routine;
        const tasks = Array.isArray(routine.tasks) ? routine.tasks : [];
        const requiredTasks = tasks.length;

        if (routine.id == null) {
          setMentalStats({
            hasRoutine: true,
            completedTasks: 0,
            requiredTasks,
            progress: 0,
          });
          return;
        }

        const trackingResponse = await fetch(
          `${MENTAL_TRACKING_API_URL}?routine_id=${encodeURIComponent(
            routine.id,
          )}&date=${encodeURIComponent(today)}`,
          {
            method: "GET",
            headers,
          },
        );
        const trackingData = await trackingResponse.json();

        const doneIds =
          trackingData.success && trackingData.tracking
            ? Array.isArray(trackingData.tracking.completed_task_ids)
              ? trackingData.tracking.completed_task_ids
              : []
            : [];

        const completedTasks = tasks.filter((task) =>
          doneIds.includes(task.id),
        ).length;
        const progress =
          requiredTasks > 0
            ? Math.min(100, Math.round((completedTasks / requiredTasks) * 100))
            : 0;

        setMentalStats({
          hasRoutine: true,
          completedTasks,
          requiredTasks,
          progress,
        });
      } catch {
        setMentalStats({
          hasRoutine: false,
          completedTasks: 0,
          requiredTasks: 0,
          progress: 0,
        });
      }
    };

    loadDashboardMentalStats();

    window.addEventListener("focus", loadDashboardMentalStats);
    window.addEventListener("storage", loadDashboardMentalStats);

    return () => {
      window.removeEventListener("focus", loadDashboardMentalStats);
      window.removeEventListener("storage", loadDashboardMentalStats);
    };
  }, []);

  useEffect(() => {
    const loadDashboardWorkoutStats = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setWorkoutStats({
          dailyWorkoutSets: 0,
          requiredWorkoutSetsToday: 0,
          workoutIntensity: 0,
        });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const today = getTodayStr();
        const response = await fetch(
          `${WORKOUT_API_URL}?startDate=${today}&endDate=${today}`,
          {
            method: "GET",
            headers,
          },
        );
        const data = await response.json();

        const todayEntries =
          data.success && Array.isArray(data.entries) ? data.entries : [];

        const dailyWorkoutSets = todayEntries.reduce(
          (sum, entry) => sum + Number(entry.sets || 0),
          0,
        );

        const savedPlanRaw = localStorage.getItem("ascension_training_plan_v1");
        let requiredWorkoutSetsToday = 0;

        if (savedPlanRaw) {
          try {
            const savedPlan = JSON.parse(savedPlanRaw);
            requiredWorkoutSetsToday = getRequiredWorkoutSetsTodayFromPlan({
              plan: savedPlan,
              dailyWorkoutPlanLabel: todayEntries[0]?.workoutType || "",
              fallbackExperience: savedPlan?.experience || "beginner",
            });
          } catch {
            requiredWorkoutSetsToday = 0;
          }
        }

        const workoutIntensity = getProgressPercent(
          dailyWorkoutSets,
          requiredWorkoutSetsToday,
        );

        setWorkoutStats({
          dailyWorkoutSets,
          requiredWorkoutSetsToday,
          workoutIntensity,
        });
      } catch {
        setWorkoutStats({
          dailyWorkoutSets: 0,
          requiredWorkoutSetsToday: 0,
          workoutIntensity: 0,
        });
      }
    };

    loadDashboardWorkoutStats();

    window.addEventListener("focus", loadDashboardWorkoutStats);
    window.addEventListener("storage", loadDashboardWorkoutStats);

    return () => {
      window.removeEventListener("focus", loadDashboardWorkoutStats);
      window.removeEventListener("storage", loadDashboardWorkoutStats);
    };
  }, []);

  useEffect(() => {
    const loadDashboardSkinStats = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setSkinStats({
          hasRoutine: false,
          completedSteps: 0,
          requiredSteps: 0,
          progress: 0,
        });
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const today = getTodayStr();

        const routineResponse = await fetch(SKIN_ROUTINE_API_URL, {
          method: "GET",
          headers,
        });
        const routineData = await routineResponse.json();

        if (!routineData.success || !routineData.routine) {
          setSkinStats({
            hasRoutine: false,
            completedSteps: 0,
            requiredSteps: 0,
            progress: 0,
          });
          return;
        }

        const routine = routineData.routine;
        const requiredSteps = getSkinRequiredStepsCount(routine);

        if (!routine.id) {
          setSkinStats({
            hasRoutine: true,
            completedSteps: 0,
            requiredSteps,
            progress: 0,
          });
          return;
        }

        const trackingResponse = await fetch(
          `${SKIN_TRACKING_API_URL}?routine_id=${encodeURIComponent(
            routine.id,
          )}&date=${encodeURIComponent(today)}`,
          {
            method: "GET",
            headers,
          },
        );
        const trackingData = await trackingResponse.json();

        const completedSteps =
          trackingData.success && trackingData.tracking
            ? [
                ...(Array.isArray(trackingData.tracking.morning_steps)
                  ? trackingData.tracking.morning_steps
                  : []),
                ...(Array.isArray(trackingData.tracking.evening_steps)
                  ? trackingData.tracking.evening_steps
                  : []),
              ].length
            : 0;

        const progress =
          requiredSteps > 0
            ? Math.min(100, Math.round((completedSteps / requiredSteps) * 100))
            : 0;

        setSkinStats({
          hasRoutine: true,
          completedSteps,
          requiredSteps,
          progress,
        });
      } catch {
        setSkinStats({
          hasRoutine: false,
          completedSteps: 0,
          requiredSteps: 0,
          progress: 0,
        });
      }
    };

    loadDashboardSkinStats();

    window.addEventListener("focus", loadDashboardSkinStats);
    window.addEventListener("storage", loadDashboardSkinStats);

    return () => {
      window.removeEventListener("focus", loadDashboardSkinStats);
      window.removeEventListener("storage", loadDashboardSkinStats);
    };
  }, []);

  const [animatedStats, setAnimatedStats] = useState({
    daysInSystem: 0,
    pslGrowth: 0,
    dailyCompletion: 0,
  });

  useEffect(() => {
    document.title = "Ascension - Dashboard";
  }, []);

  const dashboardData = useMemo(() => {
    const today = new Date();
    const createdAt = user?.createdAt ? new Date(user.createdAt) : null;

    const daysInSystem =
      createdAt && !Number.isNaN(createdAt.getTime())
        ? Math.max(
            0,
            Math.floor((today.getTime() - createdAt.getTime()) / 86400000),
          )
        : 0;

    const workoutProgress = workoutStats.workoutIntensity;
    const workoutDone = workoutStats.dailyWorkoutSets > 0;

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
        description: skinStats.hasRoutine
          ? `Mai haladás: ${skinStats.completedSteps}/${skinStats.requiredSteps} lépés`
          : "Rutin nincs beállítva. Készítsd el a személyre szabott arcápolási rutinodat.",
        buttonText: skinStats.hasRoutine
          ? "Rutin Megnyitása"
          : "Rutin Készítése",
        progress: skinStats.progress,
        route: "/arc",
      },
      {
        id: "mental",
        title: "Mentális",
        description: mentalStats.hasRoutine
          ? `Mai haladás: ${mentalStats.completedTasks}/${mentalStats.requiredTasks} feladat`
          : "Rutin nincs beállítva. Készítsd el a napi mentális rutinodat.",
        buttonText: mentalStats.hasRoutine
          ? "Mentál Megnyitása"
          : "Rutin Készítése",
        progress: mentalStats.progress,
        route: "/mental",
      },
    ];

    const completedTasks = tasks.filter((task) => task.progress >= 100).length;
    const dailyPercent = Math.round((completedTasks / tasks.length) * 100);
    const isQuestCompleted = completedTasks === tasks.length;

    return {
      daysInSystem,
      pslGrowth: isQuestCompleted ? 1 : 0,
      dailyCompletion: dailyPercent,
      completedTasks,
      isQuestCompleted,
      tasks,
    };
  }, [user, workoutStats, skinStats, mentalStats]);

  useEffect(() => {
    if (!dashboardData.isQuestCompleted) return;

    const userId = Number(user?.id || 0);
    if (!userId) return;

    const rewardKey = `${DAILY_QUEST_REWARD_PREFIX}_${userId}_${getTodayStr()}`;
    if (localStorage.getItem(rewardKey) === "1") return;

    localStorage.setItem(rewardKey, "1");

    const randomMsg =
      DAILY_QUEST_MESSAGES[
        Math.floor(Math.random() * DAILY_QUEST_MESSAGES.length)
      ];

    (async () => {
      await showAlert(
        `✅ Sikeresen teljesítetted a mai questet!\n\n🔥 ${randomMsg}`,
      );
    })();
  }, [dashboardData.isQuestCompleted, user?.id, showAlert]);

  useEffect(() => {
    const target = {
      daysInSystem: dashboardData.daysInSystem,
      pslGrowth: dashboardData.pslGrowth,
      dailyCompletion: dashboardData.dailyCompletion,
    };

    let frame;
    let start;

    const duration = 800;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);

      setAnimatedStats({
        daysInSystem: Math.round(target.daysInSystem * progress),
        pslGrowth: Number((target.pslGrowth * progress).toFixed(1)),
        dailyCompletion: Math.round(target.dailyCompletion * progress),
      });

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [
    dashboardData.daysInSystem,
    dashboardData.pslGrowth,
    dashboardData.dailyCompletion,
  ]);

  const handleTaskNavigation = (route) => {
    if (!user) {
      navigate("/");
      return;
    }

    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsProfileOpen(false);
    navigate("/");
  };

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
  );
}
