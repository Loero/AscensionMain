/* ================================
   BŐRTÍPUS KÉRDŐÍV - ARC OLDAL
================================ */

document.addEventListener('DOMContentLoaded', function() {
    const quizContainer = document.getElementById('skinQuiz');
    if (!quizContainer) return; // Csak Arc oldalon fusson

    const questionContainer = document.getElementById('questionContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const generateBtn = document.getElementById('generateBtn');
    const routineResult = document.getElementById('routineResult');

    let currentQuestion = 0;
    let answers = {};

    // KÉRDÉSEK ADATBÁZIS
    const questions = [
        {
            id: 'skin_type',
            question: 'Milyen típusú a bőröd?',
            options: [
                { value: 'normal', label: 'Normál - kiegyensúlyozott, semleges' },
                { value: 'dry', label: 'Száraz - feszes, hámló, érzékeny' },
                { value: 'oily', label: 'Zsíros - fénylő, pórusos, pattanásos' },
                { value: 'combination', label: 'Vegyes - T-zóna zsíros, arc többi része száraz' },
                { value: 'sensitive', label: 'Érzékeny - kipirosodik, viszket, ég' }
            ]
        },
        {
            id: 'age',
            question: 'Hány éves vagy?',
            options: [
                { value: 'under_25', label: '25 év alatt' },
                { value: '25_35', label: '25-35 év között' },
                { value: '35_45', label: '35-45 év között' },
                { value: '45_55', label: '45-55 év között' },
                { value: 'over_55', label: '55 év felett' }
            ]
        },
        {
            id: 'concerns',
            question: 'Milyen bőrproblémákkal küzdesz? (több is lehet)',
            options: [
                { value: 'acne', label: 'Pattanások, mitesszerek' },
                { value: 'wrinkles', label: 'Ráncok, finom vonalak' },
                { value: 'pigmentation', label: 'Pigmentfoltok, egyenetlen bőrszín' },
                { value: 'dark_circles', label: 'Sötét karikák a szem alatt' },
                { value: 'pores', label: 'Tág pórusok' },
                { value: 'none', label: 'Nincs különösebb problémám' }
            ],
            multiple: true
        },
        {
            id: 'climate',
            question: 'Milyen éghajlaton élsz?',
            options: [
                { value: 'dry_cold', label: 'Száraz, hideg éghajlat' },
                { value: 'humid_hot', label: 'Párás, forró éghajlat' },
                { value: 'moderate', label: 'Mérsékelt éghajlat' },
                { value: 'changing', label: 'Gyakran változó éghajlat' }
            ]
        },
        {
            id: 'routine',
            question: 'Jelenleg milyen gyakran ápolod a bőrödet?',
            options: [
                { value: 'never', label: 'Soha, nem foglalkozom vele' },
                { value: 'rarely', label: 'Ritkán, csak ha eszembe jut' },
                { value: 'weekly', label: 'Hetente párszor' },
                { value: 'daily_simple', label: 'Naponta, de egyszerűen' },
                { value: 'daily_complete', label: 'Naponta, teljes rutint' }
            ]
        },
        {
            id: 'products',
            question: 'Milyen termékeket használsz jelenleg?',
            options: [
                { value: 'cleanser', label: 'Arclemosó' },
                { value: 'moisturizer', label: 'Hidratáló krém' },
                { value: 'sunscreen', label: 'Naptej' },
                { value: 'serum', label: 'Szérum' },
                { value: 'exfoliant', label: 'Hámlasztó' },
                { value: 'none', label: 'Semmilyen speciális terméket' }
            ],
            multiple: true
        },
        {
            id: 'diet',
            question: 'Hogyan táplálkozol?',
            options: [
                { value: 'healthy', label: 'Egészséges, sok zöldség, gyümölcs' },
                { value: 'mixed', label: 'Vegyes, próbálok odafigyelni' },
                { value: 'fast_food', label: 'Sok gyorskaja, feldolgozott élelmiszer' },
                { value: 'vegetarian', label: 'Vegetáriánus' },
                { value: 'vegan', label: 'Vegán' }
            ]
        },
        {
            id: 'stress',
            question: 'Mennyire stresszes az életed?',
            options: [
                { value: 'low', label: 'Alacsony, nyugodt életmód' },
                { value: 'moderate', label: 'Közepes, néha stresszes' },
                { value: 'high', label: 'Magas, folyamatos stressz' },
                { value: 'very_high', label: 'Nagyon magas, extrém stressz' }
            ]
        },
        {
            id: 'sleep',
            question: 'Mennyit alszol naponta?',
            options: [
                { value: 'under_6', label: '6 óránál kevesebb' },
                { value: '6_7', label: '6-7 óra' },
                { value: '7_8', label: '7-8 óra' },
                { value: '8_9', label: '8-9 óra' },
                { value: 'over_9', label: '9 óránál több' }
            ]
        },
        {
            id: 'goals',
            question: 'Mik a céljaid a bőröddel kapcsolatban?',
            options: [
                { value: 'clear', label: 'Tiszta, aknémentes bőr' },
                { value: 'anti_aging', label: 'Ráncok megelőzése, csökkentése' },
                { value: 'hydration', label: 'Jól hidratált, ragyogó bőr' },
                { value: 'even_tone', label: 'Egyenletes bőrszín' },
                { value: 'maintenance', label: 'Jelenlegi állapot megőrzése' }
            ],
            multiple: true
        }
    ];

    // KEZDETI BETÖLTÉS
    function loadQuestion() {
        const question = questions[currentQuestion];
        const isLast = currentQuestion === questions.length - 1;
        
        // Progress frissítése
        const progress = ((currentQuestion + 1) / questions.length) * 100;
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${currentQuestion + 1} / ${questions.length}`;

        // Gombok állapotának frissítése
        prevBtn.style.display = currentQuestion === 0 ? 'none' : 'inline-block';
        nextBtn.style.display = isLast ? 'none' : 'inline-block';
        generateBtn.style.display = isLast ? 'inline-block' : 'none';

        // Kérdés HTML generálása
        let optionsHTML = '';
        if (question.multiple) {
            optionsHTML = question.options.map((option, index) => {
                const isChecked = answers[question.id] && answers[question.id].includes(option.value);
                return `
                    <label class="quiz-option">
                        <input type="checkbox" name="${question.id}" value="${option.value}" 
                               ${isChecked ? 'checked' : ''} data-index="${index}">
                        <span class="option-text">${option.label}</span>
                    </label>
                `;
            }).join('');
        } else {
            optionsHTML = question.options.map((option, index) => {
                const isChecked = answers[question.id] === option.value;
                return `
                    <label class="quiz-option">
                        <input type="radio" name="${question.id}" value="${option.value}" 
                               ${isChecked ? 'checked' : ''} data-index="${index}">
                        <span class="option-text">${option.label}</span>
                    </label>
                `;
            }).join('');
        }

        questionContainer.innerHTML = `
            <div class="question-content">
                <h4 class="question-title">${question.question}</h4>
                <div class="options-container">
                    ${optionsHTML}
                </div>
            </div>
        `;

        // Event listener-ek hozzáadása
        const inputs = questionContainer.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', saveAnswer);
        });
    }

    // VÁLASZ MENTÉSE
    function saveAnswer() {
        const question = questions[currentQuestion];
        const inputs = questionContainer.querySelectorAll(`input[name="${question.id}"]`);
        
        if (question.multiple) {
            const checkedValues = Array.from(inputs)
                .filter(input => input.checked)
                .map(input => input.value);
            answers[question.id] = checkedValues;
        } else {
            const checkedInput = Array.from(inputs).find(input => input.checked);
            if (checkedInput) {
                answers[question.id] = checkedInput.value;
            }
        }
    }

    // KÖVETKEZŐ KÉRDÉS
    function nextQuestion() {
        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            loadQuestion();
        }
    }

    // ELŐZŐ KÉRDÉS
    function prevQuestion() {
        if (currentQuestion > 0) {
            currentQuestion--;
            loadQuestion();
        }
    }

    // RUTIN GENERÁLÁSA
    async function generateRoutine() {
        try {
            // Mentjük a válaszokat
            localStorage.setItem('skinQuizAnswers', JSON.stringify(answers));
            
            // Backend API hívás
            const response = await fetch('http://localhost:3000/api/skin/routine', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
                }
            });

            const data = await response.json();

            if (data.success && data.routine) {
                // Ha van már mentett rutin, azt használjuk
                displayRoutine(data.routine);
            } else {
                // Kliens oldali generálás
                const routine = generateClientSideRoutine();
                displayRoutine(routine);
            }
        } catch (error) {
            console.error('Rutin generálási hiba:', error);
            // Kliens oldali generálás hiba esetén
            const routine = generateClientSideRoutine();
            displayRoutine(routine);
        }
    }

    // KLIENS OLDALI RUTIN GENERÁLÁS
    function generateClientSideRoutine() {
        const skinType = answers.skin_type || 'normal';
        const age = answers.age || '25_35';
        const concerns = answers.concerns || [];
        const goals = answers.goals || [];

        let routine = {
            skin_type: skinType,
            age_group: age,
            concerns: concerns,
            morning_routine: [],
            evening_routine: [],
            weekly_treatments: [],
            product_recommendations: [],
            tips: []
        };

        // Reggeli rutin generálása
        routine.morning_routine = [
            '🌅 Arclemosás (langyos víz)',
            '💧 Tonizálás',
            '🧴 Hidratáló krém',
            '☀️ Naptej (SPF 30+)'
        ];

        // Esti rutin generálása
        routine.evening_routine = [
            '🌙 Sminklemelés (ha van)',
            '🧼 Mélytisztítás',
            '💡 Szérum (problémák szerint)',
            '🌙 Éjszakai krém'
        ];

        // Speciális kezelések
        if (concerns.includes('acne')) {
            routine.weekly_treatments.push('🧪 Heti 1x BHA hámlasztás');
            routine.product_recommendations.push('Szalicilsavas toner');
        }

        if (concerns.includes('wrinkles')) {
            routine.weekly_treatments.push('⏰ Retinol bevezetése');
            routine.product_recommendations.push('Retinol szérum');
        }

        // Bőrtípus specifikus tanácsok
        if (skinType === 'dry') {
            routine.tips.push('💧 Igyál sok vizet!');
            routine.tips.push('🧴 Használj hidratáló maszkokat');
        } else if (skinType === 'oily') {
            routine.tips.push('🧻 Kerüld a túlzásos tisztítást');
            routine.tips.push('🌿 Használj olajmentes termékeket');
        }

        return routine;
    }

    // RUTIN MEGJELENÍTÉSE
    function displayRoutine(routine) {
        quizContainer.style.display = 'none';
        routineResult.style.display = 'block';

        // Elmentjük a generált rutint localStorage-ba
        localStorage.setItem('lastGeneratedRoutine', JSON.stringify(routine));

        routineResult.innerHTML = `
            <div class="routine-header">
                <h3>Személyre Szabott Arcápolási Rutin</h3>
                <p>Bőrtípusod: <strong>${getSkinTypeLabel(routine.skin_type)}</strong></p>
            </div>

            <div class="routine-section">
                <h4>Reggeli Rutin</h4>
                <ul class="routine-steps">
                    ${routine.morning_routine.map(step => `<li>${step.replace(/🌅|💧|🧴|☀️/g, '').trim()}</li>`).join('')}
                </ul>
            </div>

            <div class="routine-section">
                <h4>Esti Rutin</h4>
                <ul class="routine-steps">
                    ${routine.evening_routine.map(step => `<li>${step.replace(/🌙|🧼|💡|🌾/g, '').trim()}</li>`).join('')}
                </ul>
            </div>

            ${routine.weekly_treatments.length > 0 ? `
            <div class="routine-section">
                <h4>Heti Kezelések</h4>
                <ul class="routine-steps">
                    ${routine.weekly_treatments.map(treatment => `<li>${treatment.replace(/🧪|⏰/g, '').trim()}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            ${routine.product_recommendations.length > 0 ? `
            <div class="routine-section">
                <h4>Termék Ajánlások</h4>
                <ul class="routine-steps">
                    ${routine.product_recommendations.map(product => `<li>${product}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            ${routine.tips.length > 0 ? `
            <div class="routine-section">
                <h4>További Tanácsok</h4>
                <ul class="routine-tips">
                    ${routine.tips.map(tip => `<li>${tip.replace(/💧|🧴|🌿/g, '').trim()}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            <div class="routine-actions">
                <button class="btn-quiz btn-primary" onclick="saveRoutine()">Rutin Mentése</button>
                <button class="btn-quiz" onclick="resetQuiz()">Új Kérdőív</button>
            </div>
        `;
    }

    // Bőrtípus label getter
    function getSkinTypeLabel(skinType) {
        const labels = {
            'normal': 'Normál',
            'dry': 'Száraz',
            'oily': 'Zsíros',
            'combination': 'Vegyes',
            'sensitive': 'Érzékeny'
        };
        return labels[skinType] || skinType;
    }

    // RUTIN MENTÉSE
    window.saveRoutine = async function() {
        try {
            // Ellenőrizzük, hogy be van-e jelentkezve a felhasználó
            const token = localStorage.getItem('authToken');
            if (!token) {
                alert('A rutin mentéséhez be kell jelentkezned!');
                return;
            }
            
            const answers = JSON.parse(localStorage.getItem('skinQuizAnswers') || '{}');
            const routine = JSON.parse(localStorage.getItem('lastGeneratedRoutine') || '{}');
            
            // Ellenőrizzük, hogy vannak-e adatok
            if (!answers.skin_type || Object.keys(routine).length === 0) {
                alert('Nincs elég adat a mentéshez! Kérlek, töltsd ki a kérdőívet.');
                return;
            }
            
            console.log('📤 Rutin mentése:', { answers, routine });
            
            const response = await fetch('http://localhost:3000/api/skin/save-routine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    answers: answers,
                    routine: routine
                })
            });

            console.log('📨 Válasz státusz:', response.status);
            console.log('📨 Válasz headers:', response.headers);

            // Ellenőrizzük a válasz típusát
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('Nem JSON válasz:', text);
                alert('Szerver hiba: A backend nem JSON választ adott. Ellenőrizd a backend konzolt!');
                return;
            }

            const data = await response.json();
            console.log('✅ Válasz adatok:', data);

            if (data.success) {
                alert('Rutin sikeresen elmentve! ID: ' + data.routine_id);
                
                // Elmentjük a rutin ID-t is
                localStorage.setItem('currentRoutineId', data.routine_id);
            } else {
                alert('Hiba a mentés során: ' + data.error);
            }
        } catch (error) {
            console.error('Rutin mentési hiba:', error);
            alert('Hiba a mentés során: ' + error.message);
        }
    };

    // KÉRDŐÍV VISSZAÁLLÍTÁSA
    window.resetQuiz = function() {
        currentQuestion = 0;
        answers = {};
        quizContainer.style.display = 'block';
        routineResult.style.display = 'none';
        loadQuestion();
    };

    // EVENT LISTENEREK
    nextBtn.addEventListener('click', nextQuestion);
    prevBtn.addEventListener('click', prevQuestion);
    generateBtn.addEventListener('click', generateRoutine);

    // KEZDETI BETÖLTÉS
    loadQuestion();
});
