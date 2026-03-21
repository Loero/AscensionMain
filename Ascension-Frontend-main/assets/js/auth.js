// Bejelentkezés/Regisztráció modal kezelése
const API_URL = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', function() {
    const authModal = document.getElementById('auth-modal');
    const authToggle = document.getElementById('auth-toggle');
    const authClose = document.querySelector('.auth-close');
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const ctaJoin = document.getElementById('cta-join');
    const profileModal = document.getElementById('profile-modal');
    const profileClose = document.querySelector('.profile-close');
    const profileContent = document.getElementById('profile-content');
    const logoutBtn = document.getElementById('logout-btn');

    // Ellenőrizzük van-e bejelentkezett felhasználó
    checkAuthStatus();

    // "Csatlakozz a rendszerhez" → csak modal megnyitása (nincs azonnali redirect)
    if (ctaJoin) {
        ctaJoin.addEventListener('click', function(e) {
            e.preventDefault();

            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                // Ha már be van jelentkezve, ne nyissa meg a modalt, hanem dobja a dashboardra
                window.location.href = './dashboard.html';
                return;
            }

            if (authModal) {
                // Open modal
                authModal.classList.add('active');
                document.body.style.overflow = 'hidden';

                // Ha ez a CTA azt jelenti, hogy "csatlakozz", akkor alapból a regisztrációs tab legyen aktív
                if (authTabs && authTabs.length) {
                    authTabs.forEach(t => t.classList.remove('active'));
                    const regTab = Array.from(authTabs).find(t => t.getAttribute('data-tab') === 'register');
                    const loginTab = Array.from(authTabs).find(t => t.getAttribute('data-tab') === 'login');
                    if (regTab) regTab.classList.add('active');
                    if (loginTab) loginTab.classList.remove('active');
                }

                if (registerForm && loginForm) {
                    registerForm.classList.add('active');
                    loginForm.classList.remove('active');
                }

                // Fókusz az első regisztrációs inputra
                const regFirst = document.getElementById('register-username') || document.getElementById('register-email');
                if (regFirst) regFirst.focus();
            }
        });
    }

    // Modal megnyitása (auth toggle) - csak ha van ilyen gomb az oldalon
    if (authToggle) {
        authToggle.addEventListener('click', function(e) {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                // Ha be van jelentkezve, profil modal megnyitása
                if (typeof openProfileModal === 'function') openProfileModal();
            } else {
                // Ha nincs bejelentkezve, modal megnyitása
                if (authModal) {
                    authModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    }

    // Modal bezárása - csak ha van bezáró gomb
    if (authClose) {
        authClose.addEventListener('click', function() {
            if (authModal) {
                authModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Modal bezárása kattintásra a háttéren
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === authModal) {
                authModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Modal bezárása ESC billentyűre
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal && authModal.classList.contains('active')) {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Tab váltás - csak ha vannak tabok és formok
    if (authTabs && authTabs.length && loginForm && registerForm) {
        authTabs.forEach(tab => {
            // Ensure tab buttons do not act as submit buttons
            if (tab.tagName === 'BUTTON') tab.setAttribute('type', 'button');

            tab.addEventListener('click', function(e) {
                // Prevent default to avoid scrolling to top if button would submit
                if (e && typeof e.preventDefault === 'function') e.preventDefault();

                const tabName = this.getAttribute('data-tab');

                authTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                if (tabName === 'login') {
                    loginForm.classList.add('active');
                    registerForm.classList.remove('active');
                } else {
                    registerForm.classList.add('active');
                    loginForm.classList.remove('active');
                }
            });
        });
    }

    // Bejelentkezési form submit - csak ha létezik a form
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const emailOrUsernameEl = document.getElementById('login-email');
            const passwordEl = document.getElementById('login-password');
            const emailOrUsername = emailOrUsernameEl ? emailOrUsernameEl.value : '';
            const password = passwordEl ? passwordEl.value : '';

            try {
                console.log('🔐 Bejelentkezés indítása...');
                console.log('🌐 API URL:', `${API_URL}/login`);
                console.log('📤 Küldött adatok:', { emailOrUsername, password });

                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailOrUsername, password })
                });

                console.log('📨 Válasz státusz:', response.status);
                console.log('📨 Válasz headers:', response.headers);

                const data = await response.json();

                console.log('Válasz:', data);

                if (data.success) {
                    localStorage.setItem('authToken', data.token);

                    // Profil lekérése, hogy megkapjuk a createdAt mezőt is
                    let userToStore = data.user;
                    try {
                        const profileRes = await fetch('http://localhost:3000/api/profile', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${data.token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        const profileData = await profileRes.json();
                        if (profileData.success && profileData.profile && profileData.profile.user) {
                            userToStore = profileData.profile.user;
                        }
                    } catch (profileError) {
                        console.error('❌ Profil lekérés login után nem sikerült:', profileError);
                    }

                    localStorage.setItem('user', JSON.stringify(userToStore));

                    alert(`✅ Sikeres bejelentkezés! Üdv, ${data.user.username}! 🎉`);

                    loginForm.reset();
                    if (authModal) authModal.classList.remove('active');
                    document.body.style.overflow = 'auto';

                    updateAuthButton();

                    // Redirect to dashboard after successful login
                    window.location.href = './dashboard.html';
                } else {
                    alert(`❌ ${data.error}`);
                }
            } catch (error) {
                console.error('❌ Login hiba:', error);
                alert('❌ Nem lehet kapcsolódni a backend-hez!\n\nEllenőrizd:\n- Backend fut? (npm start)\n- Port 3000 szabad?\n- MySQL elindul?');
            }
        });
    }

    // Regisztrációs form submit
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-password-confirm').value;

            if (password !== passwordConfirm) {
                alert('❌ A jelszavak nem egyeznek!');
                return;
            }

            console.log('📝 Regisztráció indítása...', { username, email });

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();

                console.log('Válasz:', data);

                if (data.success) {
                    localStorage.setItem('authToken', data.token);

                    // Profil lekérése, hogy megkapjuk a createdAt mezőt is
                    let userToStore = data.user;
                    try {
                        const profileRes = await fetch('http://localhost:3000/api/profile', {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${data.token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        const profileData = await profileRes.json();
                        if (profileData.success && profileData.profile && profileData.profile.user) {
                            userToStore = profileData.profile.user;
                        }
                    } catch (profileError) {
                        console.error('❌ Profil lekérés regisztráció után nem sikerült:', profileError);
                    }

                    localStorage.setItem('user', JSON.stringify(userToStore));

                    alert(`✅ Sikeres regisztráció! Üdv, ${data.user.username}! 🎉`);

                    registerForm.reset();
                    if (authModal) authModal.classList.remove('active');
                    document.body.style.overflow = 'auto';

                    updateAuthButton();

                    // Redirect to dashboard after successful registration
                    window.location.href = './dashboard.html';
                } else {
                    alert(`❌ ${data.error}`);
                }
            } catch (error) {
                console.error('❌ Register hiba:', error);
                alert('❌ Nem lehet kapcsolódni a backend-hez!\n\nEllenőrizd:\n- Backend fut? (npm start)\n- Port 3000 szabad?\n- MySQL elindult?');
            }
        });
    }

    // Auth státusz ellenőrzése
    function checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        // Mindig hívjuk meg az updateAuthButton-t, hogy a navbar láthatósága helyesen beálluljon
        updateAuthButton();
    }

    // Auth gomb frissítése
    function updateAuthButton() {
        const user = JSON.parse(localStorage.getItem('user'));

        if (!authToggle) return; // Safely return if element missing on this page

        if (user) {
            // Bejelentkezett felhasználó: felhasználónév a jobb felső sarokban
            authToggle.textContent = user.username || 'Fiókod';
            authToggle.title = user.username ? `Fiókod (${user.username})` : 'Profil megtekintése';
        } else {
            // Nincs bejelentkezve: alapértelmezett szöveg
            authToggle.textContent = 'Bejelentkezés';
            authToggle.title = 'Bejelentkezés / Regisztráció';
        }
    }

    // ========== PROFIL MODAL FUNKCIÓK ==========

    // Profil modal megnyitása
    async function openProfileModal() {
        console.log('📊 Profil modal megnyitása...');

        profileModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Betöltés jelző megjelenítése
        profileContent.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #bdbdbd;">
                <p>⏳ Profil adatok betöltése...</p>
            </div>
        `;
        // Profil adatok lekérése
        await fetchProfileData();
    }

    // Tegyük elérhetővé más scriptek számára is (pl. dashboard)
    window.openProfileModal = openProfileModal;

    // Profil adatok lekérése a backend-től
    async function fetchProfileData() {
        try {
            const token = localStorage.getItem('authToken');

            if (!token) {
                profileContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #ff6a6a;">
                        <p>❌ Nincs bejelentkezve!</p>
                    </div>
                `;
                return;
            }

            console.log('🔄 Profil lekérés a backend-től...');

            const response = await fetch('http://localhost:3000/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            console.log('✅ Profil válasz:', data);

            if (!data.success) {
                profileContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #ff6a6a;">
                        <p>❌ ${data.error || 'Profil betöltése sikertelen'}</p>
                    </div>
                `;
                return;
            }

            // Napi kalória + mai étel bejegyzések lekérése az adott napra
            const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
            const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

            let dailyCalories = 0;
            let dailyFoodEntries = [];
            let dailyWorkoutMinutes = 0;
            let skinRoutineData = null;
            
            try {
                // Bőrápolási rutin lekérése
                try {
                    const skinResp = await fetch('http://localhost:3000/api/skin/routine', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    const skinData = await skinResp.json();
                    if (skinData.success && skinData.routine) {
                        skinRoutineData = skinData.routine;
                        console.log('✅ Bőrápolási rutin lekérve:', skinData.routine);
                    }
                } catch (skinErr) {
                    console.error('❌ Bőrápolási rutin lekérési hiba:', skinErr);
                }
                
                const foodResp = await fetch(`http://localhost:3000/api/food/entries?date=${todayStr}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const foodData = await foodResp.json();
                if (foodData.success && Array.isArray(foodData.entries)) {
                    dailyCalories = foodData.entries.reduce((sum, entry) => sum + (entry.calories || 0), 0);

                    // Alakítsuk a mai bejegyzéseket ugyanarra a formára, mint a profil recentEntries
                    dailyFoodEntries = foodData.entries.map(entry => ({
                        id: entry.id,
                        foodName: entry.food_name,
                        grams: entry.grams,
                        calories: entry.calories,
                        proteinG: typeof entry.protein_g === 'number' ? entry.protein_g.toFixed(1) : entry.protein_g,
                        carbsG: typeof entry.carbs_g === 'number' ? entry.carbs_g.toFixed(1) : entry.carbs_g,
                        date: entry.date,
                        createdAt: entry.created_at
                    }));
                }

                // Mai edzés percek lekérése
                try {
                    const workoutResp = await fetch(`http://localhost:3000/api/workout?startDate=${todayStr}&endDate=${todayStr}`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const workoutData = await workoutResp.json();
                    if (workoutData.success && Array.isArray(workoutData.entries)) {
                        dailyWorkoutMinutes = workoutData.entries.reduce((sum, entry) => sum + (entry.duration_minutes || 0), 0);
                    }
                } catch (woErr) {
                    console.error('❌ Napi edzés lekérési hiba:', woErr);
                }
            } catch (foodErr) {
                console.error('❌ Napi kalória lekérési hiba:', foodErr);
            }

            displayProfileData(data.profile, dailyCalories, dailyFoodEntries, dailyWorkoutMinutes, skinRoutineData);
        } catch (error) {
            console.error('❌ Profil lekérési hiba:', error);
            profileContent.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #ff6a6a;">
                    <p>❌ Nem lehet kapcsolódni a szerverhez!</p>
                    <p style="font-size: 14px; margin-top: 10px;">Ellenőrizd, hogy a backend fut-e.</p>
                </div>
            `;
        }
    }

    // Profil adatok megjelenítése
    function displayProfileData(profile, dailyCalories, dailyFoodEntries = [], dailyWorkoutMinutes = 0, skinRoutineData = null) {
        console.log('🎨 Profil megjelenítése:', profile);

        const { user, food, workout, personal } = profile;

        // Dátum formázása
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('hu-HU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        };

        const formatShortDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
        };

        const mapGoal = (goal) => {
            if (!goal) return '-';
            if (goal === 'deficit') return 'Fogyás';
            if (goal === 'maintain') return 'Súlytartás';
            if (goal === 'surplus') return 'Tömegnövelés';
            return goal;
        };

        const mapExperience = (exp) => {
            if (!exp) return '-';
            if (exp === 'beginner') return 'Kezdő';
            if (exp === 'intermediate') return 'Középhaladó';
            if (exp === 'advanced') return 'Haladó';
            return exp;
        };

        const getSkinTypeLabel = (skinType) => {
            const labels = {
                'normal': 'Normál',
                'dry': 'Száraz',
                'oily': 'Zsíros',
                'combination': 'Vegyes',
                'sensitive': 'Érzékeny'
            };
            return labels[skinType] || skinType;
        };

        const getAgeGroupLabel = (ageGroup) => {
            const labels = {
                'under_25': '25 év alatt',
                '25_35': '25-35 év',
                '35_45': '35-45 év',
                '45_55': '45-55 év',
                'over_55': '55 év felett'
            };
            return labels[ageGroup] || ageGroup;
        };

        const mapActivity = (mult) => {
            if (!mult) return '-';
            const m = parseFloat(mult);
            if (m === 1.2) return 'Ülő életmód';
            if (m === 1.375) return 'Könnyű aktivitás (1-3 nap/hét)';
            if (m === 1.55) return 'Közepes aktivitás (3-5 nap/hét)';
            if (m === 1.725) return 'Aktív (6-7 nap/hét)';
            if (m === 1.9) return 'Nagyon aktív (napi 2x edzés)';
            return `Aktivitási szorzó: ${m}`;
        };

        // Tabs + két nézet: Statisztikák / Adatok
        let html = `
            <div class="profile-tabs">
                <button id="profile-show-stats" class="profile-mode-btn active">Statisztikák</button>
                <button id="profile-show-data" class="profile-mode-btn">Adatok</button>
            </div>

            <div id="profile-stats-view">
                <div class="profile-section">
                    <h3>👤 Felhasználói adatok</h3>
                    <div class="profile-info">
                        <p><strong>Felhasználónév:</strong> ${user.username}</p>
                        <p><strong>E-mail:</strong> ${user.email}</p>
                        <p><strong>Regisztráció dátuma:</strong> ${formatDate(user.createdAt)}</p>
                    </div>
                </div>

                <div class="profile-section">
                    <h3>🍎 Kalória számláló statisztikák</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-title">📅 Napi kalória bevitel</div>
                            <div class="stat-value">${Math.round(dailyCalories)} kcal</div>
                            <div class="stat-details">
                                <p>${food.week.entries} heti bejegyzés</p>
                                <p>${food.week.totalProtein}g fehérje (hét)</p>
                                <p>${food.week.totalCarbs}g szénhidrát (hét)</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-title">🗓️ Heti kalória bevitel</div>
                            <div class="stat-value">${Math.round(food.week.totalCalories)} kcal</div>
                            <div class="stat-details">
                                <p>${food.week.entries} bejegyzés</p>
                                <p>${food.week.totalProtein}g fehérje</p>
                                <p>${food.week.totalCarbs}g szénhidrát</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-title">🏆 Összesen</div>
                            <div class="stat-value">${Math.round(food.total.totalCalories)} kcal</div>
                            <div class="stat-details">
                                <p>${food.total.entries} bejegyzés</p>
                                <p>${food.total.totalProtein}g fehérje</p>
                                <p>${food.total.totalCarbs}g szénhidrát</p>
                            </div>
                        </div>
                    </div>
                    <div style="margin-top: 18px; border-top: 1px solid #333; padding-top: 14px;">
                        <h4 style="margin: 0 0 10px 0; color: #f7d774;">Mai bevitt ételek</h4>
                        ${dailyFoodEntries.length === 0
                          ? `<div style="text-align: center; padding: 12px; color: #bdbdbd;"><p>Még nincsenek mai étel bejegyzések.</p></div>`
                          : `<div class="entries-list">${dailyFoodEntries.map(entry => {
                              const formattedDate = formatShortDate(entry.date);
                              return `
                                <div class="entry-item">
                                    <div class="entry-header">
                                        <span class="entry-type">🥗 ${entry.foodName}</span>
                                        <span class="entry-date">${formattedDate}</span>
                                    </div>
                                    <div class="entry-details">
                                        <span>${entry.grams}g</span>
                                        <span>${Math.round(entry.calories)} kcal</span>
                                        <span>F: ${entry.proteinG}g</span>
                                        <span>SH: ${entry.carbsG}g</span>
                                    </div>
                                </div>
                              `;
                            }).join('')}</div>`}
                    </div>
                </div>

                <div class="profile-section">
                    <h3>🏋️ Edzés statisztikák</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-title">📅 Ma</div>
                            <div class="stat-value">${Math.round(dailyWorkoutMinutes)} perc</div>
                            <div class="stat-details">
                                <p>Mai összes edzésidő</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-title">🗓️ Heti összes perc</div>
                            <div class="stat-value">${Math.round(workout.week.totalDuration)} perc</div>
                            <div class="stat-details">
                                <p>${workout.week.entries} edzés</p>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-title">🏆 Összesen</div>
                            <div class="stat-value">${Math.round(workout.total.totalDuration)} perc</div>
                            <div class="stat-details">
                                <p>${workout.total.entries} edzés</p>
                            </div>
                        </div>
                    </div>
                </div>
        `;

        // stats-view lezárása
        html += `</div>`;

        // === ADATOK NÉZET ===
        html += `
            <div id="profile-data-view" style="display:none;">
                <div class="profile-section">
                    <h3>📋 Személyes adatok (Tervhez)</h3>
                    <div class="profile-info">
                        <p><strong>Életkor:</strong> ${personal && personal.age ? personal.age + ' év' : '– nincs megadva –'}</p>
                        <p><strong>Súly:</strong> ${personal && personal.weightKg ? personal.weightKg + ' kg' : '– nincs megadva –'}</p>
                        <p><strong>Magasság:</strong> ${personal && personal.heightCm ? personal.heightCm + ' cm' : '– nincs megadva –'}</p>
                        <p><strong>Nem:</strong> ${personal && personal.gender ? (personal.gender === 'male' ? 'Férfi' : personal.gender === 'female' ? 'Nő' : personal.gender) : '– nincs megadva –'}</p>
                        <p><strong>Aktivitás:</strong> ${personal && personal.activityMultiplier ? mapActivity(personal.activityMultiplier) : '– nincs megadva –'}</p>
                        <p><strong>Cél:</strong> ${personal ? mapGoal(personal.goal) : '-'}</p>
                        <p><strong>Edzés tapasztalat:</strong> ${personal ? mapExperience(personal.experience) : '-'}</p>
                        ${personal && personal.updatedAt ? `<p><strong>Utoljára frissítve:</strong> ${formatDate(personal.updatedAt)}</p>` : ''}
                    </div>
                    <p style="font-size: 13px; color: #bdbdbd; margin-top: 8px;">Ezek az adatok a Test oldalon megadott űrlap alapján kerülnek mentésre.</p>
                </div>

                <div class="profile-section">
                    <h3>💪 Generált Edzésterv</h3>
                    <div class="profile-info">
                        ${(() => {
                            try {
                                const planData = JSON.parse(localStorage.getItem('ascension_training_plan_v1'));
                                if (!planData) throw new Error('No plan');
                                
                                const experienceNames = {
                                    'beginner': 'Kezdő',
                                    'intermediate': 'Haladó',
                                    'advanced': 'Profi'
                                };
                                
                                const goalNames = {
                                    'deficit': 'Fogyás',
                                    'surplus': 'Tömegnövelés',
                                    'maintain': 'Tartás'
                                };
                                
                                const exp = experienceNames[planData.experience] || planData.experience;
                                const gol = goalNames[planData.goal] || planData.goal;

                                if (planData.planHtml) {
                                    const goalAdvice = planData.goalAdviceHtml || '';
                                    return `
                                        <p><strong>Szint:</strong> ${exp}</p>
                                        <p><strong>Cél:</strong> ${gol}</p>
                                        <div style="margin-top: 12px;">
                                            ${planData.planHtml}
                                            ${goalAdvice}
                                        </div>
                                    `;
                                }

                                let fallbackHtml = '';
                                if (planData.planStructure && Object.keys(planData.planStructure).length > 0) {
                                    fallbackHtml = Object.entries(planData.planStructure)
                                        .map(([day, exercises]) => `
                                            <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                                                <p style="margin: 0 0 6px 0;"><strong>${day}</strong></p>
                                                <p style="margin: 0; color: #ddd;">${Array.isArray(exercises) ? exercises.join(', ') : '-'}</p>
                                            </div>
                                        `)
                                        .join('');
                                } else {
                                    fallbackHtml = '<p style="color: #bdbdbd;">A részletes terv még nincs mentve.</p>';
                                }

                                return `<p><strong>Szint:</strong> ${exp}</p><p><strong>Cél:</strong> ${gol}</p>${fallbackHtml}`;
                            } catch (e) {
                                return '<p style="color: #bdbdbd;">Még nincs generált edzésterv.</p>';
                            }
                        })()}
                    </div>
                </div>

                <div class="profile-section">
                    <h3>🥗 Részletes étkezés (utóbbi bejegyzések)</h3>
        `;

        if (!food.recentEntries || food.recentEntries.length === 0) {
            html += `
                <div style="text-align: center; padding: 20px; color: #bdbdbd;">
                    <p>Még nincsenek mentett étel bejegyzéseid.</p>
                </div>
            `;
        } else {
            html += `<div class="entries-list">`;

            food.recentEntries.forEach(entry => {
                const formattedDate = formatShortDate(entry.date);
                html += `
                    <div class="entry-item">
                        <div class="entry-header">
                            <span class="entry-type">🥗 ${entry.foodName}</span>
                            <span class="entry-date">${formattedDate}</span>
                        </div>
                        <div class="entry-details">
                            <span>${entry.grams}g</span>
                            <span>${Math.round(entry.calories)} kcal</span>
                            <span>F: ${entry.proteinG}g</span>
                            <span>SH: ${entry.carbsG}g</span>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        html += `</div>`; // étel profile-section lezárás

        html += `
                <div class="profile-section">
                    <h3>🏋️ Részletes edzés (utóbbi bejegyzések)</h3>
        `;

        if (!workout.recentEntries || workout.recentEntries.length === 0) {
            html += `
                <div style="text-align: center; padding: 20px; color: #bdbdbd;">
                    <p>Még nincsenek mentett edzés bejegyzéseid.</p>
                </div>
            `;
        } else {
            html += `<div class="entries-list">`;

            workout.recentEntries.forEach(entry => {
                const formattedDate = formatShortDate(entry.date);
                html += `
                    <div class="entry-item">
                        <div class="entry-header">
                            <span class="entry-type">🏋️ ${entry.exerciseName || entry.workoutType}</span>
                            <span class="entry-date">${formattedDate}</span>
                        </div>
                        <div class="entry-details">
                            <span>${entry.durationMinutes} perc</span>
                            ${entry.weightKg ? `<span>${entry.weightKg} kg</span>` : ''}
                            ${entry.sets ? `<span>${entry.sets}×${entry.reps || '-'} ismétlés</span>` : ''}
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        }

        html += `
                </div>
                
                <div class="profile-section">
                    <h3>🧴 Bőrápolási Rutin</h3>
                    ${skinRoutineData ? `
                        <div class="skin-routine-info">
                            <div class="routine-header-info">
                                <p><strong>Bőrtípus:</strong> ${getSkinTypeLabel(skinRoutineData.skin_type)}</p>
                                <p><strong>Korcsoport:</strong> ${getAgeGroupLabel(skinRoutineData.age_group)}</p>
                                <p><strong>Létrehozva:</strong> ${formatDate(skinRoutineData.created_at)}</p>
                            </div>
                            
                            <div class="routine-details">
                                <div class="routine-section-mini">
                                    <h4>🌅 Reggeli Rutin</h4>
                                    <ul class="routine-steps-mini">
                                        ${skinRoutineData.morning_routine.map(step => `<li>${step}</li>`).join('')}
                                    </ul>
                                </div>
                                
                                <div class="routine-section-mini">
                                    <h4>🌙 Esti Rutin</h4>
                                    <ul class="routine-steps-mini">
                                        ${skinRoutineData.evening_routine.map(step => `<li>${step}</li>`).join('')}
                                    </ul>
                                </div>
                                
                                ${skinRoutineData.weekly_treatments && skinRoutineData.weekly_treatments.length > 0 ? `
                                <div class="routine-section-mini">
                                    <h4>📅 Heti Kezelések</h4>
                                    <ul class="routine-steps-mini">
                                        ${skinRoutineData.weekly_treatments.map(treatment => `<li>${treatment}</li>`).join('')}
                                    </ul>
                                </div>
                                ` : ''}
                                
                                ${skinRoutineData.product_recommendations && skinRoutineData.product_recommendations.length > 0 ? `
                                <div class="routine-section-mini">
                                    <h4>🛍️ Ajánlott Termékek</h4>
                                    <ul class="routine-steps-mini">
                                        ${skinRoutineData.product_recommendations.map(product => `<li>${product}</li>`).join('')}
                                    </ul>
                                </div>
                                ` : ''}
                            </div>
                            
                            <div style="margin-top: 15px; text-align: center;">
                                <button onclick="window.location.href='./oldalak/menupontok/Arc.html'" style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                                    🔄 Rutin Frissítése
                                </button>
                            </div>
                        </div>
                    ` : `
                        <div style="text-align: center; padding: 20px; color: #bdbdbd;">
                            <p>Még nincs mentett bőrápolási rutinod.</p>
                            <button onclick="window.location.href='./oldalak/menupontok/Arc.html'" style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; margin-top: 10px;">
                                🧪 Rutin Készítése
                            </button>
                        </div>
                    `}
                </div>
                
                <div class="profile-section" style="border-top: 1px solid #444; padding-top: 20px; margin-top: 20px;">
                    <button id="delete-profile-data-btn" style="background-color: #d32f2f; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;">
                        🗑️ Adatok Törlése és Újrakezdés
                    </button>
                    <p style="font-size: 12px; color: #bdbdbd; margin-top: 10px;">Ez törli az összes mentett személyes adatodat és edzéstervedet. Új adatok megadása után újra létre kell generálnod az edzéstervet.</p>
                </div>
            </div>
        `; // profile-data-view lezárás

        profileContent.innerHTML = html;

        // Tab váltás események
        const statsBtn = document.getElementById('profile-show-stats');
        const dataBtn = document.getElementById('profile-show-data');
        const statsView = document.getElementById('profile-stats-view');
        const dataView = document.getElementById('profile-data-view');

        if (statsBtn && dataBtn && statsView && dataView) {
            statsBtn.addEventListener('click', () => {
                statsView.style.display = '';
                dataView.style.display = 'none';
                statsBtn.classList.add('active');
                dataBtn.classList.remove('active');
            });

            dataBtn.addEventListener('click', () => {
                statsView.style.display = 'none';
                dataView.style.display = '';
                dataBtn.classList.add('active');
                statsBtn.classList.remove('active');
            });

            // Delete button
            const deleteBtn = document.getElementById('delete-profile-data-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', deleteProfileData);
            }
        }
    }

    // Profil modal bezárása
    if (profileClose) {
        profileClose.addEventListener('click', function() {
            profileModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    // Modal bezárása kattintásra a háttéren
    if (profileModal) {
        profileModal.addEventListener('click', function(e) {
            if (e.target === profileModal) {
                profileModal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }

    // Modal bezárása ESC billentyűre
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && profileModal && profileModal.classList.contains('active')) {
            profileModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Kijelentkezés gomb
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Biztosan ki szeretnél jelentkezni?')) {
                console.log('👋 Kijelentkezés...');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                alert('✅ Sikeresen kijelentkeztél!');
                location.reload();
            }
        });
    }
});

// Profil adatok törlésére
async function deleteProfileData() {
    if (!confirm('⚠️ Biztosan törölni szeretnéd az összes adatodat? Ez nem vonható vissza!\n\nTöröl:\n- Személyes adatok (kor, súly, magasság, stb.)\n- Generált edzésterv\n- Étel és edzés előzmények')) {
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('❌ Bejelentkezés szükséges!');
            return;
        }

        // Adatok törlése a backendről
        const response = await fetch('http://localhost:3000/api/profile/details', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Backend hiba: ' + response.statusText);
        }

        // localStorage adatok törlése
        localStorage.removeItem('ascension_training_plan_v1');
        localStorage.removeItem('ascension_workouts_v1');

        alert('✅ Mind az összes adatod sikeresen törölve lett. Megnyíl a Test oldal az új adatok megadásához.');
        
        // Átirányítás a test oldalra
        window.location.href = './test.html';

    } catch (error) {
        console.error('Hiba az adatok törlésénél:', error);
        alert('❌ Hiba az adatok törlésénél: ' + error.message);
    }
}
