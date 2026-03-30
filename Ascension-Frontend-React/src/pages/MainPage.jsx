import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import NavbarMain from "../components/NavbarMain"
import AuthModal from "../components/AuthModal"
import ProfileModal from "../components/ProfileModal"
import "./MainPage.css"

const AUTH_API_URL = "http://localhost:3000/api/auth"

export default function MainPage() {
  const navigate = useNavigate()


  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [authDefaultTab, setAuthDefaultTab] = useState("login")
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem("user")
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const [user, setUser] = useState(getStoredUser)

  const decodeJwtUser = (token) => {
    try {
      const payload = token.split(".")[1]
      const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
      const json = decodeURIComponent(
        atob(normalized)
          .split("")
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
          .join("")
      )

      const decoded = JSON.parse(json)

      return {
        id: decoded.userId,
        username: decoded.username,
        email: decoded.email,
      }
    } catch {
      return null
    }
  }

  useEffect(() => {
    const syncAuth = () => {
      const token = localStorage.getItem("authToken")
      const storedUser = getStoredUser()

      if (token && storedUser) {
        setUser(storedUser)
      } else {
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

  const [typewriterText, setTypewriterText] = useState("")

  const words = useMemo(() => ["comfort", "average"], [])

  useEffect(() => {
    let wordIndex = 0
    let charIndex = 0
    let isDeleting = false
    let timeoutId

    const type = () => {
      const currentWord = words[wordIndex]

      if (isDeleting) {
        setTypewriterText(currentWord.substring(0, charIndex - 1))
        charIndex -= 1

        if (charIndex === 0) {
          isDeleting = false
          wordIndex = (wordIndex + 1) % words.length
          timeoutId = setTimeout(type, 500)
          return
        }

        timeoutId = setTimeout(type, 50)
      } else {
        setTypewriterText(currentWord.substring(0, charIndex + 1))
        charIndex += 1

        if (charIndex === currentWord.length) {
          isDeleting = true
          timeoutId = setTimeout(type, 2000)
          return
        }

        timeoutId = setTimeout(type, 100)
      }
    }

    type()

    return () => clearTimeout(timeoutId)
  }, [words])

  useEffect(() => {
    const elements = document.querySelectorAll(
      ".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale"
    )

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed")
          }
        })
      },
      { threshold: 0.15 }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [])


  const authButtonLabel = user?.username || "Bejelentkezés"

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)

    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  }

  const handleAuthButtonClick = () => {
    const storedUser = getStoredUser()

    if (storedUser) {
      setIsProfileOpen(true)
      return
    }

    setAuthDefaultTab("login")
    setIsAuthOpen(true)
  }

  const handleJoinClick = () => {
    const storedUser = getStoredUser()

    if (storedUser) {
      navigate("/dashboard")
      return
    }

    setAuthDefaultTab("register")
    setIsAuthOpen(true)
  }

  const handleProtectedNavigation = (path) => {
    const storedUser = getStoredUser()

    if (!storedUser) {
      setAuthDefaultTab("login")
      setIsAuthOpen(true)
      return
    }

    navigate(path)
  }

  const handleLogin = async ({ emailOrUsername, password }) => {
    setIsSubmittingAuth(true)

    try {
      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      })

      const data = await response.json()

      if (!response.ok || !data.success || !data.token) {
        alert(`❌ ${data.error || "Sikertelen bejelentkezés."}`)
        return
      }

      const userFromToken = decodeJwtUser(data.token)

      if (!userFromToken) {
        alert("❌ Sikeres login történt, de a token nem dolgozható fel.")
        return
      }

      localStorage.setItem("authToken", data.token)
      localStorage.setItem("user", JSON.stringify(userFromToken))
      setUser(userFromToken)
      setIsAuthOpen(false)

      alert(`✅ Sikeres bejelentkezés! Üdv, ${userFromToken.username}! 🎉`)
      navigate("/dashboard")
    } catch {
      alert(
        "❌ Nem lehet kapcsolódni a backendhez.\n\nEllenőrizd:\n- fut-e a backend,\n- a 3000-es portot,\n- az adatbázist."
      )
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const handleRegister = async ({
    username,
    email,
    password,
    passwordConfirm,
  }) => {
    if (password !== passwordConfirm) {
      alert("❌ A jelszavak nem egyeznek!")
      return
    }

    setIsSubmittingAuth(true)

    try {
      const registerResponse = await fetch(`${AUTH_API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok || !registerData.success) {
        alert(`❌ ${registerData.error || "Sikertelen regisztráció."}`)
        return
      }

      // automatikus beléptetés regisztráció után
      const loginResponse = await fetch(`${AUTH_API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: username,
          password,
        }),
      })

      const loginData = await loginResponse.json()

      if (!loginResponse.ok || !loginData.success || !loginData.token) {
        alert("✅ Sikeres regisztráció, de az automatikus bejelentkezés nem sikerült.")
        setIsAuthOpen(false)
        return
      }

      const userFromToken = decodeJwtUser(loginData.token)

      if (!userFromToken) {
        alert("✅ Sikeres regisztráció, de a token nem dolgozható fel.")
        setIsAuthOpen(false)
        return
      }

      localStorage.setItem("authToken", loginData.token)
      localStorage.setItem("user", JSON.stringify(userFromToken))
      setUser(userFromToken)
      setIsAuthOpen(false)

      alert(`✅ Sikeres regisztráció! Üdv, ${userFromToken.username}! 🎉`)
      navigate("/dashboard")
    } catch {
      alert(
        "❌ Nem lehet kapcsolódni a backendhez.\n\nEllenőrizd:\n- fut-e a backend,\n- a 3000-es portot,\n- az adatbázist."
      )
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    localStorage.removeItem("user")
    setUser(null)
    setIsProfileOpen(false)
    alert("✅ Sikeres kijelentkezés.")
  }

  return (
    <div className="page-loaded">
      <NavbarMain
        onAuthButtonClick={handleAuthButtonClick}
        onScrollToSection={scrollToSection}
        authButtonLabel={authButtonLabel}
      />

      <section className="core-hero">
        <h2 className="scroll-reveal revealed">
          <span className="hero-main-text">Beyond </span>
          <span className="typewriter-word">{typewriterText}</span>
          <span className="cursor">|</span>
        </h2>

        <p className="scroll-reveal stagger-1">
          Ez nem motiváció.
          <br />
          Ez egy rendszer azoknak, akik felelősséget vállalnak.
        </p>

        <section className="button-section scroll-reveal stagger-2">
          <button
            className="cta-join"
            aria-label="Csatlakozz a rendszerhez"
            onClick={handleJoinClick}
          >
            Csatlakozz a rendszerhez
          </button>
        </section>

        <div className="tagline-ladder-section scroll-reveal stagger-3">
          <div className="tagline-ladder">
            <div className="tagline-row">
              Softmaxxing • Hardmaxxing • Rating &amp; Progress Tracking
            </div>
            <div className="tagline-row">
              Edzés • Táplálkozás • Arcfejlesztés • Stílus • Mentális edge
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="content-section">
        <div className="section-content">
          <h2>GYAKRAN ISMÉTELT KÉRDÉSEK</h2>

          <div className="faq-item scroll-reveal">
            <h3>Mi az a looksmaxxing?</h3>
            <p>
              A looksmaxxing a külső megjelenés tudatos optimalizálása
              tudományos módszerekkel.
            </p>
          </div>

          <div className="faq-item scroll-reveal stagger-1">
            <h3>Mennyi idő alatt láthatók eredmények?</h3>
            <p>
              Átlagosan 90 nap alatt +1.4 PSL javulás érhető el a rendszer
              következetes alkalmazásával.
            </p>
          </div>

          <div className="faq-item scroll-reveal stagger-2">
            <h3>Szükséges edzéstapasztalat?</h3>
            <p>
              Nem, a rendszer minden szinten működik, kezdőtől a profi szintig.
            </p>
          </div>
        </div>
      </section>

      <section id="about" className="content-section">
        <div className="section-content">
          <h2>MI AZ ASCENSION?</h2>
          <p className="scroll-reveal">
            Az Ascension egy komplett rendszer a férfiak önfejlesztésére. Nem
            csupán motivációs tartalom, hanem egy tudományos alapú megközelítés,
            amely lefedi a test, arc, stílus és mentális fejlődés minden
            területét.
          </p>

          <div className="feature-grid">
            <div className="feature-card scroll-reveal">
              <h3>Test</h3>
              <p>
                Személyre szabott edzéstervek, táplálkozási útmutatók és progress
                tracking.
              </p>
            </div>

            <div className="feature-card scroll-reveal stagger-1">
              <h3>Arc</h3>
              <p>
                Bőrápolási rutinok, arcápolási tippek és AI elemzés a maximális
                eredményekért.
              </p>
            </div>

            <div className="feature-card scroll-reveal stagger-2">
              <h3>Mentál</h3>
              <p>
                Mentális edzések, meditációs technikák és tudatossági
                gyakorlatok.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="transformations" className="content-section">
        <div className="section-content">
          <h2>ÁTALAKULÁSOK</h2>
          <p className="scroll-reveal">
            Valódi eredmények valós emberektől, akik követték a rendszert.
          </p>

          <div className="transformation-grid">
            <div className="transformation-item scroll-reveal">
              <div className="before-after">
                <div className="ba-frame">
                  <img
                    className="ba-img ba-before"
                    src="/assets/img/before.png"
                    alt="Before"
                  />
                  <img
                    className="ba-img ba-after"
                    src="/assets/img/after.png"
                    alt="After"
                  />
                  <div className="ba-overlay"></div>
                  <span className="ba-label ba-label-before" aria-hidden="true">
                    Before
                  </span>
                  <span className="ba-label ba-label-after" aria-hidden="true">
                    After
                  </span>
                </div>
              </div>
              <div className="transformation-info">
                <h3>Péter, 28</h3>
                <p>+2.1 PSL 6 hónap alatt</p>
              </div>
            </div>

            <div className="transformation-item scroll-reveal stagger-1">
              <div className="before-after">
                <div className="ba-frame">
                  <img
                    className="ba-img ba-before"
                    src="/assets/img/beforedavid.png"
                    alt="Before"
                  />
                  <img
                    className="ba-img ba-after"
                    src="/assets/img/afterdavid.png"
                    alt="After"
                  />
                  <div className="ba-overlay"></div>
                  <span className="ba-label ba-label-before" aria-hidden="true">
                    Before
                  </span>
                  <span className="ba-label ba-label-after" aria-hidden="true">
                    After
                  </span>
                </div>
              </div>
              <div className="transformation-info">
                <h3>Gábor, 35</h3>
                <p>+1.8 PSL 4 hónap alatt</p>
              </div>
            </div>

            <div className="transformation-item scroll-reveal stagger-2">
              <div className="before-after">
                <div className="ba-frame">
                  <img
                    className="ba-img ba-before"
                    src="/assets/img/before.png"
                    alt="Before"
                  />
                  <img
                    className="ba-img ba-after"
                    src="/assets/img/after.png"
                    alt="After"
                  />
                  <div className="ba-overlay"></div>
                  <span className="ba-label ba-label-before" aria-hidden="true">
                    Before
                  </span>
                  <span className="ba-label ba-label-after" aria-hidden="true">
                    After
                  </span>
                </div>
              </div>
              <div className="transformation-info">
                <h3>Ádám, 24</h3>
                <p>+1.6 PSL 3 hónap alatt</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="video-section">
        <p className="video-intro scroll-reveal">
          Egy rövid videó, ami elmagyarázza a looksmaxxingot röviden.
        </p>

        <div className="video-container scroll-reveal stagger-1">
          <iframe
            id="youtube-video"
            src="https://www.youtube-nocookie.com/embed/jfulHL73Mhc"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Looksmaxxing videó"
          ></iframe>
        </div>

        <div className="video-stats scroll-reveal stagger-2">
          <div>
            <strong>1400+ férfi</strong> vállalta már a felelősséget.
          </div>
        </div>

        <div className="video-figure scroll-reveal stagger-3">
          <img src="/assets/img/gigachad.png" alt="Gigachad" />
        </div>

        <div className="tagline-ladder-section scroll-reveal stagger-4">
          <div className="tagline-ladder">
            <div className="tagline-row">
              Edzés • Arcápolás • Egészség • Tökéletes élet
            </div>
          </div>
        </div>

        <section className="button-section video-cta-section scroll-reveal stagger-5">
          <button
            className="cta-join cta-join-compact"
            aria-label="Csatlakozz a rendszerhez"
            onClick={handleJoinClick}
          >
            Csatlakozz a rendszerhez
          </button>
        </section>
      </section>

      <section className="daily-checklist">
        <button
          className="cta-join cta-join-compact"
          onClick={() => handleProtectedNavigation("/test")}
        >
          Edzés
        </button>

        <button
          className="cta-join cta-join-compact"
          onClick={() => handleProtectedNavigation("/arc")}
        >
          Arcápolás
        </button>

        <button
          className="cta-join cta-join-compact"
          onClick={() => handleProtectedNavigation("/mental")}
        >
          Mentális egészség
        </button>
      </section>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        defaultTab={authDefaultTab}
        isSubmitting={isSubmittingAuth}
      />

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