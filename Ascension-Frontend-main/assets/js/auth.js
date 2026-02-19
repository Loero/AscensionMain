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

    // "Csatlakozz a rendszerhez" → modal megnyitása Regisztráció tabbal
    if (ctaJoin) {
        ctaJoin.addEventListener('click', function(e) {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) return;
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            authTabs.forEach(t => t.classList.remove('active'));
            const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
            if (registerTab) {
                registerTab.classList.add('active');
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            }
        });
    }    // Modal megnyitása
    authToggle.addEventListener('click', function(e) {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            // Ha be van jelentkezve, profil modal megnyitása
            openProfileModal();
        } else {
            // Ha nincs bejelentkezve, modal megnyitása
            authModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    });

    // Modal bezárása
    authClose.addEventListener('click', function() {
        authModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Modal bezárása kattintásra a háttéren
    authModal.addEventListener('click', function(e) {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Modal bezárása ESC billentyűre
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && authModal.classList.contains('active')) {
            authModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    });

    // Tab váltás
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
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

    // Bejelentkezési form submit
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailOrUsername = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        console.log('🔐 Bejelentkezés indítása...');
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emailOrUsername, password })
            });
            
            const data = await response.json();
            
            console.log('Válasz:', data);
            
            if (data.success) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert(`✅ Sikeres bejelentkezés! Üdv, ${data.user.username}! 🎉`);
                
                loginForm.reset();
                authModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                
                updateAuthButton();
            } else {
                alert(`❌ ${data.error}`);
            }
        } catch (error) {
            console.error('❌ Login hiba:', error);
            alert('❌ Nem lehet kapcsolódni a backend-hez!\n\nEllenőrizd:\n- Backend fut? (npm start)\n- Port 3000 szabad?\n- MySQL elindul?');
        }
    });

    // Regisztrációs form submit
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
                localStorage.setItem('user', JSON.stringify(data.user));
                
                alert(`✅ Sikeres regisztráció! Üdv, ${data.user.username}! 🎉`);
                
                registerForm.reset();
                authModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                
                updateAuthButton();
            } else {
                alert(`❌ ${data.error}`);
            }
        } catch (error) {
            console.error('❌ Register hiba:', error);
            alert('❌ Nem lehet kapcsolódni a backend-hez!\n\nEllenőrizd:\n- Backend fut? (npm start)\n- Port 3000 szabad?\n- MySQL elindult?');
        }
    });
    
    // Auth státusz ellenőrzése
    function checkAuthStatus() {
        const token = localStorage.getItem('authToken');
        // Mindig hívjuk meg az updateAuthButton-t, hogy a navbar láthatósága helyesen beálluljon
        updateAuthButton();
    }
    
    // Auth gomb frissítése
    function updateAuthButton() {
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (user) {
            // Bejelentkezett felhasználó: gomb szövegének frissítése
            authToggle.textContent = user.username;
            authToggle.title = 'Profil megtekintése';
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
            
            if (data.success) {
                displayProfileData(data.profile);
            } else {
                profileContent.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #ff6a6a;">
                        <p>❌ ${data.error || 'Profil betöltése sikertelen'}</p>
                    </div>
                `;
            }
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
    function displayProfileData(profile) {
        console.log('🎨 Profil megjelenítése:', profile);
        
        const { user, alcohol, food, workout } = profile;
        
        // Dátum formázása
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('hu-HU', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        };
        
        // Felhasználói adatok section
        let html = `
            <div class="profile-section">
                <h3>👤 Felhasználói adatok</h3>
                <div class="profile-info">
                    <p><strong>Felhasználónév:</strong> ${user.username}</p>
                    <p><strong>E-mail:</strong> ${user.email}</p>
                    <p><strong>Regisztráció dátuma:</strong> ${formatDate(user.createdAt)}</p>
                </div>
            </div>
        `;
        
        // Alkohol Statisztikák section
        html += `
            <div class="profile-section">
                <h3>🍺 Alkoholfogyasztás statisztikák</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-title">🗓️ Ez a hét</div>
                        <div class="stat-value">${Math.round(alcohol.week.totalMl)} ml</div>
                        <div class="stat-details">
                            <p>${alcohol.week.entries} bejegyzés</p>
                            <p>${Math.round(alcohol.week.totalCalories)} kalória</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-title">📅 Ez a hónap</div>
                        <div class="stat-value">${Math.round(alcohol.month.totalMl)} ml</div>
                        <div class="stat-details">
                            <p>${alcohol.month.entries} bejegyzés</p>
                            <p>${Math.round(alcohol.month.totalCalories)} kalória</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-title">🏆 Összesen</div>
                        <div class="stat-value">${Math.round(alcohol.total.totalMl)} ml</div>
                        <div class="stat-details">
                            <p>${alcohol.total.entries} bejegyzés</p>
                            <p>${Math.round(alcohol.total.totalCalories)} kalória</p>
                            <p>Átlag: ${alcohol.total.avgAlcoholPercentage}% alkohol</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Étel Tracker Statisztikák section
        html += `
            <div class="profile-section">
                <h3>🍎 Kalória számláló statisztikák</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-title">🗓️ Ez a hét</div>
                        <div class="stat-value">${Math.round(food.week.totalCalories)} kcal</div>
                        <div class="stat-details">
                            <p>${food.week.entries} bejegyzés</p>
                            <p>${food.week.totalProtein}g fehérje</p>
                            <p>${food.week.totalCarbs}g szénhidrát</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-title">📅 Ez a hónap</div>
                        <div class="stat-value">${Math.round(food.month.totalCalories)} kcal</div>
                        <div class="stat-details">
                            <p>${food.month.entries} bejegyzés</p>
                            <p>${food.month.totalProtein}g fehérje</p>
                            <p>${food.month.totalCarbs}g szénhidrát</p>
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
            </div>
        `;
        
        // Edzés statisztikák section
        html += `
            <div class="profile-section">
                <h3>🏋️ Edzés statisztikák</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-title">🗓️ Ez a hét</div>
                        <div class="stat-value">${Math.round(workout.week.totalDuration)} perc</div>
                        <div class="stat-details">
                            <p>${workout.week.entries} edzés</p>
                            <p>${Math.round(workout.week.totalCalories)} kalória égetés</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-title">📅 Ez a hónap</div>
                        <div class="stat-value">${Math.round(workout.month.totalDuration)} perc</div>
                        <div class="stat-details">
                            <p>${workout.month.entries} edzés</p>
                            <p>${Math.round(workout.month.totalCalories)} kalória égetés</p>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-title">🏆 Összesen</div>
                        <div class="stat-value">${Math.round(workout.total.totalDuration)} perc</div>
                        <div class="stat-details">
                            <p>${workout.total.entries} edzés</p>
                            <p>${Math.round(workout.total.totalCalories)} kalória égetés</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Legutóbbi alkohol bejegyzések section
        html += `
            <div class="profile-section">
                <h3>🍺 Legutóbbi alkohol bejegyzések (5)</h3>
        `;
        
        if (alcohol.recentEntries.length === 0) {
            html += `
                <div style="text-align: center; padding: 20px; color: #bdbdbd;">
                    <p>Még nincsenek alkohol bejegyzések.</p>
                </div>
            `;
        } else {
            html += `<div class="entries-list">`;
            
            alcohol.recentEntries.forEach(entry => {
                const entryDate = new Date(entry.date);
                const formattedDate = entryDate.toLocaleDateString('hu-HU', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                html += `
                    <div class="entry-item">
                        <div class="entry-header">
                            <span class="entry-type">🍷 ${entry.drinkType}</span>
                            <span class="entry-date">${formattedDate}</span>
                        </div>
                        <div class="entry-details">
                            <span>${entry.amountMl} ml</span>
                            <span>${entry.alcoholPercentage}%</span>
                            <span>${Math.round(entry.calories)} kcal</span>
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        html += `</div>`;
        
        // Legutóbbi étel bejegyzések section
        html += `
            <div class="profile-section">
                <h3>🥗 Legutóbbi étel bejegyzések (5)</h3>
        `;
        
        if (food.recentEntries.length === 0) {
            html += `
                <div style="text-align: center; padding: 20px; color: #bdbdbd;">
                    <p>Még nincsenek étel bejegyzések.</p>
                </div>
            `;
        } else {
            html += `<div class="entries-list">`;
            
            food.recentEntries.forEach(entry => {
                const entryDate = new Date(entry.date);
                const formattedDate = entryDate.toLocaleDateString('hu-HU', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                
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
        
        html += `</div>`;
        
        // Legutóbbi edzés bejegyzések section
        html += `
            <div class="profile-section">
                <h3>🏋️ Legutóbbi edzés bejegyzések (5)</h3>
        `;
        
        if (workout.recentEntries.length === 0) {
            html += `
                <div style="text-align: center; padding: 20px; color: #bdbdbd;">
                    <p>Még nincsenek edzés bejegyzések.</p>
                </div>
            `;
        } else {
            html += `<div class="entries-list">`;
            
            workout.recentEntries.forEach(entry => {
                const entryDate = new Date(entry.date);
                const formattedDate = entryDate.toLocaleDateString('hu-HU', { 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                html += `
                    <div class="entry-item">
                        <div class="entry-header">
                            <span class="entry-type">🏋️ ${entry.workoutType} - ${entry.exerciseName}</span>
                            <span class="entry-date">${formattedDate}</span>
                        </div>
                        <div class="entry-details">
                            <span>${entry.durationMinutes} perc</span>
                            <span>${Math.round(entry.caloriesBurned)} kcal</span>
                `;
                
                if (entry.sets && entry.reps) {
                    html += `<span>${entry.sets}x${entry.reps}</span>`;
                }
                
                if (entry.weightKg) {
                    html += `<span>${entry.weightKg}kg</span>`;
                }
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            html += `</div>`;
        }
        
        html += `</div>`;
        
        profileContent.innerHTML = html;
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
