import React from 'react'
import blackpill from '../assets/img/blackpill.png'
import '../assets/js/auth.js'

export default function Home() {

    return (
        <div>
            {/* <!-- SPLASH: fekete pirula --> */}
            <div
                id="splash"
                className="splash-overlay"
                role="button"
                aria-label="Kattints a kezdéshez"
                tabIndex="0"
            >
                <div className="pill-wrap">
                    <img src={blackpill} alt="Black pill" className="pill-img" />
                    <div className="pill-caption" aria-hidden="false">take the pill</div>
                </div>
            </div>

            <header id="main-header">
                {/* <!-- Videó háttér --> */}
                <video autoPlay muted loop playsInline className="header-video">
                    <source src="assets/video/mainvideo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* <!-- Króm overlay --> */}
                <div className="overlay"></div>

                {/* <!-- Hangerő gomb --> */}
                <button
                    id="volume-toggle"
                    className="volume-toggle"
                    aria-label="Hang ki/be"
                    title="Hang ki/be"
                ></button>

                {/* <!-- Bejelentkezés/Regisztráció gomb --> */}
                <button
                    id="auth-toggle"
                    className="auth-toggle"
                    aria-label="Bejelentkezés / Regisztráció"
                    title="Bejelentkezés / Regisztráció"
                >
                    Bejelentkezés
                </button>

                {/* <!-- Szöveg --> */}
                <div className="header-content">
                    <h1>Ascension</h1>
                    <p>Csak vedd be a fekete pirulát</p>
                </div>
            </header>

            <section className="chrome-section">
                <div className="container">
                    <div className="text">
                        <h2>Mi a looksmaxxing?</h2>
                        <p>
                            A looksmaxxing egy önfejlesztő folyamat, amely segít a külső
                            megjelenés javításában, az önbizalom növelésében és a pozitív
                            életminőség elérésében.
                        </p>
                        <p>
                            Előnyei közé tartozik a fokozott önbizalom, jobb társas kapcsolatok,
                            és a személyes megjelenés tudatos kezelése.
                        </p>
                    </div>

                    {/* <!-- Before / After képkeret --> */}
                    <div className="before-after">
                        <div className="ba-frame">
                            <img
                                className="ba-img ba-before"
                                src="assets/img/before.png"
                                alt="Before"
                            />
                            <img
                                className="ba-img ba-after"
                                src="assets/img/after.png"
                                alt="After"
                            />
                            <div className="ba-overlay"></div>
                            <span className="ba-label ba-label-before" aria-hidden="true"
                            >Before</span
                            >
                            <span className="ba-label ba-label-after" aria-hidden="true"
                            >After</span
                            >
                        </div>
                    </div>

                    <div className="text">
                        <h2>Testi egészség</h2>
                        <p>
                            A testi egészség megőrzése elengedhetetlen a looksmaxxing
                            folyamatában. Fontos, hogy a külső megjelenés mellett a belső
                            egészségünkre is figyeljünk.
                        </p>
                        <p>
                            Az egészséges táplálkozás, a rendszeres testmozgás és a megfelelő
                            pihenés mind hozzájárulnak a testi és lelki jólétünkhöz.
                        </p>
                    </div>
                    <div className="text">
                        <h2>Mentális egészség</h2>
                        <p>
                            A mentális egészség megőrzése elengedhetetlen a looksmaxxing
                            folyamatában. Fontos, hogy a külső megjelenés mellett a belső
                            egészségünkre is figyeljünk.
                        </p>
                        <p>
                            Az egészséges mentális állapot hozzájárul a jobb önértékeléshez és a
                            pozitív életminőséghez.
                        </p>
                    </div>
                    <a href="oldalak/main.html" className="btn-accent cta-center btn-wide"
                    >Kezdés</a
                    >
                </div>
            </section>    {/* <!-- Bejelentkezés/Regisztráció Modal --> */}
            <div id="auth-modal" className="auth-modal">
                <div className="auth-modal-content">
                    <button className="auth-close" aria-label="Bezárás">&times;</button>

                    {/* <!-- Tab váltó gombok --> */}
                    <div className="auth-tabs">
                        <button className="auth-tab active" data-tab="login">Bejelentkezés</button>
                        <button className="auth-tab" data-tab="register">Regisztráció</button>
                    </div>

                    {/* <!-- Bejelentkezési form --> */}
                    <form id="login-form" className="auth-form active">
                        <h2>Bejelentkezés</h2>
                        <div className="form-group">
                            <label htmlFor="login-email">E-mail vagy felhasználónév</label>
                            <input type="text" id="login-email" name="email" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="login-password">Jelszó</label>
                            <input type="password" id="login-password" name="password" required />
                        </div>
                        <button type="submit" className="btn-auth">Belépés</button>
                    </form>

                    {/* <!-- Regisztrációs form --> */}
                    <form id="register-form" className="auth-form">
                        <h2>Regisztráció</h2>
                        <div className="form-group">
                            <label htmlFor="register-username">Felhasználónév</label>
                            <input type="text" id="register-username" name="username" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="register-email">E-mail cím</label>
                            <input type="email" id="register-email" name="email" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="register-password">Jelszó</label>
                            <input type="password" id="register-password" name="password" required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="register-password-confirm">Jelszó megerősítése</label>
                            <input type="password" id="register-password-confirm" name="password-confirm" required />
                        </div>
                        <button type="submit" className="btn-auth">Regisztráció</button>
                    </form>
                </div>
            </div>

            {/* <!-- Profil Modal --> */}
            <div id="profile-modal" className="auth-modal">
                <div className="auth-modal-content profile-modal-content">
                    <button className="auth-close profile-close" aria-label="Bezárás">&times;</button>

                    <h2 style={{ textAlign: 'center', margin: '0 0 30px', fontFamily: "'Cinzel', serif", color: '#f5f5f5' }}>Profilom</h2>

                    <div id="profile-content">
                        {/* <!-- Ide kerül a dinamikusan generált profil tartalom --> */}
                        <div style={{ textAlign: 'center', padding: '40px', color: '#bdbdbd' }}>
                            <p>Profil betöltése...</p>
                        </div>
                    </div>

                    <button id="logout-btn" className="logout-btn">Kijelentkezés</button>
                </div>
            </div>

            {/* <!-- audio: nem autoplay, majd a splash kattintás indítja --> */}
            <audio
                id="page-audio"
                src="assets/audio/indexmusic.wav"
                loop
                preload="auto"
            ></audio>
            {/* <!-- pill hang lejátszása a splash kattintásakor (ha van audio/pill.mp3) --> */}
            <audio id="pill-audio" src="assets/audio/pill.mp3" preload="auto"></audio>

        </div>
    )
}
