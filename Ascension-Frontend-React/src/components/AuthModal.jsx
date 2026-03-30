import { useEffect, useState } from "react"

export default function AuthModal({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  defaultTab = "login",
  isSubmitting = false,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const [loginData, setLoginData] = useState({
    emailOrUsername: "",
    password: "",
  })

  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
  })

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    await onLogin(loginData)
  }

  const handleRegisterSubmit = async (e) => {
    e.preventDefault()
    await onRegister(registerData)
  }

  return (
    <div className="auth-modal active" onClick={onClose}>
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" aria-label="Bezárás" onClick={onClose}>
          &times;
        </button>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
            type="button"
          >
            Bejelentkezés
          </button>

          <button
            className={`auth-tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
            type="button"
          >
            Regisztráció
          </button>
        </div>

        {activeTab === "login" && (
          <form className="auth-form active" onSubmit={handleLoginSubmit}>
            <h2>Bejelentkezés</h2>

            <div className="form-group">
              <label htmlFor="login-email">E-mail vagy felhasználónév</label>
              <input
                type="text"
                id="login-email"
                name="emailOrUsername"
                required
                value={loginData.emailOrUsername}
                onChange={(e) =>
                  setLoginData((prev) => ({
                    ...prev,
                    emailOrUsername: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Jelszó</label>
              <input
                type="password"
                id="login-password"
                name="password"
                required
                value={loginData.password}
                onChange={(e) =>
                  setLoginData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </div>

            <button type="submit" className="btn-auth" disabled={isSubmitting}>
              {isSubmitting ? "Betöltés..." : "Belépés"}
            </button>
          </form>
        )}

        {activeTab === "register" && (
          <form className="auth-form active" onSubmit={handleRegisterSubmit}>
            <h2>Regisztráció</h2>

            <div className="form-group">
              <label htmlFor="register-username">Felhasználónév</label>
              <input
                type="text"
                id="register-username"
                name="username"
                required
                value={registerData.username}
                onChange={(e) =>
                  setRegisterData((prev) => ({
                    ...prev,
                    username: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-email">E-mail cím</label>
              <input
                type="email"
                id="register-email"
                name="email"
                required
                value={registerData.email}
                onChange={(e) =>
                  setRegisterData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password">Jelszó</label>
              <input
                type="password"
                id="register-password"
                name="password"
                required
                value={registerData.password}
                onChange={(e) =>
                  setRegisterData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="register-password-confirm">
                Jelszó megerősítése
              </label>
              <input
                type="password"
                id="register-password-confirm"
                name="passwordConfirm"
                required
                value={registerData.passwordConfirm}
                onChange={(e) =>
                  setRegisterData((prev) => ({
                    ...prev,
                    passwordConfirm: e.target.value,
                  }))
                }
              />
            </div>

            <button type="submit" className="btn-auth" disabled={isSubmitting}>
              {isSubmitting ? "Betöltés..." : "Regisztráció"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}