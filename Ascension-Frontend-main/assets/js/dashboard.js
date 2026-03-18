/* ================================
   DASHBOARD JAVASCRIPT
   ================================ */

document.addEventListener("DOMContentLoaded", () => {

    // Segédfüggvény: dátum formázása YYYY-MM-DD-re
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate() + 0).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // Segédfüggvény: tetszőleges date érték normalizálása YYYY-MM-DD-re
    function normalizeDate(value) {
        if (!value) return null;
        if (typeof value === "string") {
            return value.slice(0, 10);
        }
        const d = new Date(value);
        if (isNaN(d.getTime())) return null;
        return formatDate(d);
    }

    // === HAMBURGER MENU FUNCTIONALITY ===
    const hamburgerMenu = document.getElementById("hamburger-menu");
    const mobileNav = document.getElementById("mobile-nav");
    const navClose = document.getElementById("nav-close");
    
    // Toggle mobile navigation
    if (hamburgerMenu && mobileNav) {
        hamburgerMenu.addEventListener("click", () => {
            hamburgerMenu.classList.toggle("active");
            mobileNav.classList.toggle("active");
            
            // Prevent body scroll when menu is open
            if (mobileNav.classList.contains("active")) {
                document.body.style.overflow = "hidden";
            } else {
                document.body.style.overflow = "";
            }
        });
    }
    
    // Close mobile navigation
    if (navClose && mobileNav) {
        navClose.addEventListener("click", () => {
            hamburgerMenu.classList.remove("active");
            mobileNav.classList.remove("active");
            document.body.style.overflow = "";
        });
    }
    
    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
        if (mobileNav && 
            !mobileNav.contains(e.target) && 
            !hamburgerMenu.contains(e.target) &&
            mobileNav.classList.contains("active")) {
            hamburgerMenu.classList.remove("active");
            mobileNav.classList.remove("active");
            document.body.style.overflow = "";
        }
    });
    
    // Close menu when pressing Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && mobileNav && mobileNav.classList.contains("active")) {
            hamburgerMenu.classList.remove("active");
            mobileNav.classList.remove("active");
            document.body.style.overflow = "";
        }
    });
    
    // === PROFILE MODAL FUNCTIONALITY ===
    const profileBtn = document.getElementById("profile-btn");
    const profileModal = document.getElementById("profile-modal");
    const profileClose = document.querySelector(".profile-close");
    const logoutBtnModal = document.getElementById("logout-btn-modal");
    
    // Open profile modal
    if (profileBtn && profileModal) {
        profileBtn.addEventListener("click", (e) => {
            e.preventDefault();
            profileModal.classList.add("active");
            document.body.style.overflow = "hidden";
            
            // Load profile data
            loadProfileData();
        });
    }
    
    // Close profile modal
    if (profileClose && profileModal) {
        profileClose.addEventListener("click", () => {
            profileModal.classList.remove("active");
            document.body.style.overflow = "";
        });
    }
    
    // Close modal when clicking outside
    document.addEventListener("click", (e) => {
        if (profileModal && 
            profileModal.classList.contains("active") &&
            !profileModal.contains(e.target) &&
            !profileBtn.contains(e.target)) {
            profileModal.classList.remove("active");
            document.body.style.overflow = "";
        }
    });
    
    // === LOGOUT FUNCTIONALITY ===
    const logoutBtn = document.getElementById("logout-btn");
    
    function handleLogout() {
        // Clear local storage
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        
        // Redirect to main page
        window.location.href = "../oldalak/main.html";
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
    
    if (logoutBtnModal) {
        logoutBtnModal.addEventListener("click", (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
    
    // Segédfüggvény: hány napja van a rendszerben a felhasználó
    function getDaysInSystem(user) {
        if (!user || !user.createdAt) return 0;

        const created = new Date(user.createdAt);
        if (isNaN(created.getTime())) return 0;

        const now = new Date();
        const diffMs = now - created;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // +1, hogy a regisztráció napja is számítson (min. 1 nap)
        return Math.max(1, diffDays + 1);
    }

    // === LOAD PROFILE DATA ===
    function loadProfileData() {
        const profileContent = document.getElementById("profile-content");
        if (!profileContent) return;
        
        // Get user data from localStorage
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const daysInSystem = getDaysInSystem(user);
        
        // Simulate loading profile data
        profileContent.innerHTML = `
            <div class="profile-info">
                <div class="profile-avatar">
                    <img src="../assets/img/default-avatar.png" alt="Profilkép" style="width: 100px; height: 100px; border-radius: 50%; margin-bottom: 20px; border: 3px solid var(--accent);" />
                </div>
                <h3 style="color: var(--accent); margin-bottom: 10px;">${user.username || "Felhasználó"}</h3>
                <p style="color: var(--muted); margin-bottom: 20px;">${user.email || "email@example.com"}</p>
                
                <div class="profile-stats" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                    <div style="text-align: center; padding: 20px; background: rgba(43, 43, 43, 0.8); border-radius: 8px;">
                        <h4 style="color: var(--accent); font-size: 1.5rem; margin-bottom: 5px;">${daysInSystem}</h4>
                        <p style="color: var(--muted); margin: 0;">Nap a rendszerben</p>
                    </div>
                    <div style="text-align: center; padding: 20px; background: rgba(43, 43, 43, 0.8); border-radius: 8px;">
                        <h4 style="color: var(--accent); font-size: 1.5rem; margin-bottom: 5px;">0.0</h4>
                        <p style="color: var(--muted); margin: 0;">PSL növekedés</p>
                    </div>
                </div>
                
                <div class="profile-actions">
                    <button style="width: 100%; background: rgba(255, 215, 0, 0.1); color: var(--accent); border: 1px solid rgba(255, 215, 0, 0.3); padding: 12px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255, 215, 0, 0.2)'" onmouseout="this.style.background='rgba(255, 215, 0, 0.1)'">
                        Beállítások módosítása
                    </button>
                    <button style="width: 100%; background: rgba(255, 255, 255, 0.1); color: var(--text); border: 1px solid rgba(255, 255, 255, 0.2); padding: 12px; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;" onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
                        Előfizetés kezelése
                    </button>
                </div>
            </div>
        `;
    }
    
    // === TASK BUTTON FUNCTIONALITY ===
    const taskButtons = document.querySelectorAll(".task-btn");
    
    taskButtons.forEach(button => {
        button.addEventListener("click", function() {
            const taskCard = this.closest(".task-card");
            const taskTitle = taskCard.querySelector("h3").textContent;
            
            // Show notification or redirect based on task type
            switch(taskTitle) {
                case "Edzés":
                    window.location.href = "./menupontok/Test.html";
                    break;
                case "Arcápolás":
                    window.location.href = "./menupontok/Arc.html";
                    break;
                case "Mentális":
                    window.location.href = "./menupontok/Mental.html";
                    break;
                default:
                    alert(`${taskTitle} beállítása hamarosan elérhető!`);
            }
        });
    });
    
    // === NAPI AKTIVITÁS ÉS PSL SZÁMÍTÁS ===
    async function calculateDailyStats(user) {
        const token = localStorage.getItem("authToken");
        if (!token) {
            return { weeklyCompletion: 0, pslGrowth: 0.0 };
        }

        const now = new Date();
        const todayStr = formatDate(now);

        const createdAtDate = user && user.createdAt ? new Date(user.createdAt) : null;

        const headers = {
            "Authorization": `Bearer ${token}`
        };

        try {
            const [foodRes, workoutRes] = await Promise.all([
                fetch(`http://localhost:3000/api/food/entries?date=${todayStr}`, { headers }),
                fetch(`http://localhost:3000/api/workout?startDate=${todayStr}&endDate=${todayStr}`, { headers })
            ]);

            const foodData = await foodRes.json();
            const workoutData = await workoutRes.json();

            const foodEntries = foodData.success ? (foodData.entries || []) : [];
            const workoutEntries = workoutData.success ? (workoutData.entries || []) : [];

            // Ha van createdAt és ma előtte regisztrált, ne számoljuk (elméletben ilyen nincs, de védelem)
            if (createdAtDate) {
                const createdDay = new Date(createdAtDate.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate());
                const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (currentDay < createdDay) {
                    return { dailyCompletion: 0, pslGrowth: 0.0 };
                }
            }

            // Napi feladatok: étel + edzés
            let completedTasks = 0;
            const maxTasks = 2; // 2 terület: étel + edzés

            if (foodEntries.length > 0) completedTasks++;
            if (workoutEntries.length > 0) completedTasks++;

            const dailyCompletion = maxTasks === 0
                ? 0
                : Math.round((completedTasks / maxTasks) * 100);

            // PSL növekedés: 0–2.0 skála a napi kitöltés alapján
            const pslGrowth = parseFloat(((dailyCompletion / 100) * 2).toFixed(1));

            return { dailyCompletion, pslGrowth };
        } catch (err) {
            console.error("❌ Napi statisztika számítás hiba:", err);
            return { dailyCompletion: 0, pslGrowth: 0.0 };
        }
    }

    // === UPDATE STATS ===
    async function updateStats() {
        // Felhasználó beolvasása a localStorage-ből
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const daysInSystem = getDaysInSystem(user);
        const { dailyCompletion, pslGrowth } = await calculateDailyStats(user);
        
        // Update stat cards
        const statCards = document.querySelectorAll(".stat-card h3");
        if (statCards.length >= 3) {
            statCards[0].textContent = daysInSystem;
            statCards[1].textContent = pslGrowth.toFixed(1);
            statCards[2].textContent = dailyCompletion + "%";
        }
    }
    
    // Initialize stats
    updateStats();
    
    // === CHECK AUTHENTICATION ===
    function checkAuth() {
        const token = localStorage.getItem("authToken");
        if (!token) {
            // Redirect to main page if not authenticated
            window.location.href = "../oldalak/main.html";
            return false;
        }
        return true;
    }
    
    // Check authentication on load
    if (!checkAuth()) {
        return; // Stop execution if not authenticated
    }
    
    console.log("Dashboard loaded successfully!");
});
