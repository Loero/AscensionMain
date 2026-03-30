import { useEffect, useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import "./Navbar.css"

export default function Navbar({ onOpenProfile, user }) {
    const navigate = useNavigate()
    const location = useLocation()

    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [isMenuOpen])

    const authButtonLabel = user?.username || "Bejelentkezés"

    const handleAuthClick = () => {
        if (user) {
            onOpenProfile?.()
            return
        }

        navigate("/")
    }

    const handleLogout = () => {
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
        setIsMenuOpen(false)
        navigate("/")
    }

    const goTo = (path) => {
        setIsMenuOpen(false)
        navigate(path)
    }

    return (
        <>
            <header className="dashboard-header">
                <div className="header-left"></div>

                <Link
                    className="header-brand"
                    to="/dashboard"
                    aria-label="Vissza a Dashboard oldalra"
                >
                    ASCEND
                </Link>

                <button
                    className={`hamburger-menu ${isMenuOpen ? "active" : ""}`}
                    aria-label="Menü"
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </header>

            <button
                className="auth-toggle"
                aria-label="Bejelentkezés / Fiókod"
                title={
                    user
                        ? `Fiókod (${user.username || "Felhasználó"})`
                        : "Bejelentkezés / Regisztráció"
                }
                onClick={handleAuthClick}
            >
                {authButtonLabel}
            </button>

            <nav className={`mobile-nav ${isMenuOpen ? "active" : ""}`}>
                <div className="nav-content">
                    <button
                        className="nav-close"
                        aria-label="Bezárás"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        &times;
                    </button>

                    <div className="nav-section">
                        <h3>Fejlesztési Területek</h3>
                        <ul className="nav-links">
                            <li>
                                <button
                                    className={`nav-link nav-link-button ${location.pathname === "/test" ? "is-current" : ""}`}
                                    onClick={() => goTo("/test")}
                                >
                                    <span className="nav-icon">💪</span>
                                    <span className="nav-text">Test</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`nav-link nav-link-button ${location.pathname === "/arc" ? "is-current" : ""}`}
                                    onClick={() => goTo("/arc")}
                                >
                                    <span className="nav-icon">👤</span>
                                    <span className="nav-text">Arc</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`nav-link nav-link-button ${location.pathname === "/mental" ? "is-current" : ""}`}
                                    onClick={() => goTo("/mental")}
                                >
                                    <span className="nav-icon">🧠</span>
                                    <span className="nav-text">Mentál</span>
                                </button>
                            </li>
                        </ul>
                    </div>

                    <div className="nav-section">
                        <h3>Navigáció</h3>
                        <ul className="nav-links">
                            <li>
                                <button
                                    className={`nav-link nav-link-button ${location.pathname === "/" ? "is-current" : ""}`}
                                    onClick={() => goTo("/")}
                                >
                                    <span className="nav-icon">🏠</span>
                                    <span className="nav-text">Vissza a főoldalra</span>
                                </button>
                            </li>
                            <li>
                                <button
                                    className={`nav-link nav-link-button ${location.pathname === "/dashboard" ? "is-current" : ""}`}
                                    onClick={() => goTo("/dashboard")}
                                >
                                    <span className="nav-icon">📊</span>
                                    <span className="nav-text">Dashboard</span>
                                </button>
                            </li>
                        </ul>
                    </div>

                    {user && (
                        <div className="nav-section nav-section-account">
                            <h3>Fiók</h3>
                            <ul className="nav-links">
                                <li>
                                    <button className="nav-link nav-link-button" onClick={handleLogout}>
                                        <span className="nav-icon">🚪</span>
                                        <span className="nav-text">Kijelentkezés</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </nav>
        </>
    )
}