export default function NavbarMain({
  onAuthButtonClick,
  onScrollToSection,
  authButtonLabel,
}) {
  return (
    <>
      <nav className="main-nav">
        <button className="nav-btn" onClick={() => onScrollToSection("faq")}>
          FAQ
        </button>

        <button className="nav-btn" onClick={() => onScrollToSection("about")}>
          Mi az az Ascension
        </button>

        <button
          className="nav-btn"
          onClick={() => onScrollToSection("transformations")}
        >
          Átalakulások
        </button>
      </nav>

      <button
        className="auth-toggle"
        aria-label="Bejelentkezés / Fiókod"
        title={
          authButtonLabel === "Bejelentkezés"
            ? "Bejelentkezés / Regisztráció"
            : "Profil megtekintése"
        }
        onClick={onAuthButtonClick}
      >
        {authButtonLabel}
      </button>
    </>
  )
}