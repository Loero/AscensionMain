/* ================================
   ARC FELTÖLTÉS + AI ELEMZÉS
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("faceUploadForm");
  const input = document.getElementById("faceImage");
  const preview = document.getElementById("facePreview");
  const resultBox = document.getElementById("aiResult");

  if (!form || !input || !preview || !resultBox) return;

  // KÉP ELŐNÉZET
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(file);
  });

  // FELTÖLTÉS → BACKEND → VÁLASZ
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = input.files[0];
    if (!file) {
      resultBox.innerHTML = "❌ Nincs kép kiválasztva";
      resultBox.style.display = "block";
      return;
    }

    resultBox.innerHTML = "⏳ Elemzés folyamatban...";
    resultBox.style.display = "block";

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:3000/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        resultBox.innerHTML = "❌ Elemzés sikertelen";
        return;
      }

      resultBox.innerHTML = `
        <h4>AI elemzés eredménye</h4>
        <pre style="white-space:pre-wrap; font-size:0.9em;">
${JSON.stringify(data, null, 2)}
        </pre>
      `;
    } catch (err) {
      resultBox.innerHTML = "❌ Nem érhető el a szerver";
    }
  });
});

/* ================================
   KEZDŐLAP: SPLASH + AUDIO KEZELÉS
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const splash = document.getElementById("splash");
  const pageAudio = document.getElementById("page-audio");
  const pillAudio = document.getElementById("pill-audio");
  const volumeBtn = document.getElementById("volume-toggle");

  if (!splash || !pageAudio || !volumeBtn) return; // csak a kezdőlapon fut

  let started = false;

  async function startExperience() {
    if (started) return;
    started = true;

    // Rejtse el az overlay-t
    splash.style.opacity = "0";
    // Engedjük látszani az oldalt és indítsuk az animációkat
    document.body.classList.add("page-loaded");
    document.body.classList.remove("splash-visible");
    setTimeout(() => {
      if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
    }, 300);

    try {
      // Elsőként rövid "pill" hang, ha van
      if (pillAudio) {
        pillAudio.currentTime = 0;
        await pillAudio.play().catch(() => {});
      }
      // Háttérzene
      pageAudio.muted = false;
      pageAudio.volume = 0.5;
      await pageAudio.play().catch(() => {
        // Ha nem sikerül azonnal, maradjon elérhető a gombbal
      });
      updateVolumeButton();
    } catch (e) {
      // Ignoráljuk a böngésző autoplay blokkját, a gomb megoldja
    }
  }

  function updateVolumeButton() {
    // Állapot osztályok (CSS ikonokhoz)
    if (pageAudio.paused || pageAudio.muted) {
      volumeBtn.classList.add("muted");
      volumeBtn.classList.remove("playing");
    } else {
      volumeBtn.classList.remove("muted");
      volumeBtn.classList.add("playing");
    }
  }

  // Splash kattintás / billentyű
  splash.addEventListener("click", startExperience);
  splash.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") startExperience();
  });

  // Hangerő gomb: play/pause + mute toggle
  volumeBtn.addEventListener("click", async () => {
    // Ha még nem indult semmi, indítsuk el a zenét
    if (!started) await startExperience();

    if (pageAudio.paused) {
      pageAudio.muted = false;
      await pageAudio.play().catch(() => {});
    } else {
      // Néma helyett használjunk pause-t, hogy egyértelmű legyen
      pageAudio.pause();
    }
    updateVolumeButton();
  });
});

/* ================================
   TYPEWRITER EFFECT: CORE-HERO
   Only alternates "comfort" and "average" words
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const typewriterElement = document.getElementById("typewriter-text");
  if (!typewriterElement) return;

  const words = ["comfort", "average"];
  let currentWordIndex = 0;
  let currentCharIndex = 0;
  let isDeleting = false;
  let typingSpeed = 100; // milliseconds per character
  let deletingSpeed = 50; // milliseconds per character (faster when deleting)
  let pauseTime = 2000; // pause after completing a word

  function typeWriter() {
    const currentWord = words[currentWordIndex];
    
    if (isDeleting) {
      // Deleting characters
      typewriterElement.textContent = currentWord.substring(0, currentCharIndex - 1);
      currentCharIndex--;
      
      if (currentCharIndex === 0) {
        // Finished deleting, switch to next word
        isDeleting = false;
        currentWordIndex = (currentWordIndex + 1) % words.length;
        setTimeout(typeWriter, 500); // Brief pause before starting next word
        return;
      }
      
      setTimeout(typeWriter, deletingSpeed);
    } else {
      // Typing characters
      typewriterElement.textContent = currentWord.substring(0, currentCharIndex + 1);
      currentCharIndex++;
      
      if (currentCharIndex === currentWord.length) {
        // Finished typing, pause then start deleting
        isDeleting = true;
        setTimeout(typeWriter, pauseTime);
        return;
      }
      
      setTimeout(typeWriter, typingSpeed);
    }
  }

  // Start the typewriter effect
  typeWriter();
});

/* === SCROLL REVEAL ANIMATION === */
document.addEventListener('DOMContentLoaded', function() {
    const scrollRevealElements = document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale');
    
    const revealOnScroll = function() {
        scrollRevealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementBottom = element.getBoundingClientRect().bottom;
            const windowHeight = window.innerHeight;
            
            // Reveal element when it's 15% visible from bottom
            if (elementTop < windowHeight * 0.85) {
                element.classList.add('revealed');
            }
        });
    };
    
    // Initial check
    revealOnScroll();
    
    // Check on scroll with throttling
    let ticking = false;
    const scrollHandler = function() {
        if (!ticking) {
            requestAnimationFrame(function() {
                revealOnScroll();
                ticking = false;
            });
            ticking = true;
        }
    };
    
    window.addEventListener('scroll', scrollHandler);
    window.addEventListener('resize', revealOnScroll);
});

/* DAILY CHECKLIST: dropdown toggle (open/close) */
document.addEventListener("DOMContentLoaded", () => {
  const toggles = document.querySelectorAll(".dropdown-toggle");
  const container = document.querySelector(".daily-checklist");
  const ctaJoin = document.getElementById("cta-join");
  
  if (!container || !toggles.length) return;

  // Enable all dropdown toggles
  toggles.forEach((btn) => {
    btn.classList.remove("disabled");
    
    // Add click handler for navigation based on auth status
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user) {
        // User is not logged in, open registration modal
        const authModal = document.getElementById("auth-modal");
        const authTabs = document.querySelectorAll(".auth-tab");
        const registerForm = document.getElementById("register-form");
        const loginForm = document.getElementById("login-form");

        if (authModal) {
          authModal.classList.add("active");
          document.body.style.overflow = "hidden";

          // Switch to registration tab
          authTabs.forEach(t => t.classList.remove("active"));
          const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
          if (registerTab) {
            registerTab.classList.add("active");
            registerForm.classList.add("active");
            loginForm.classList.remove("active");
          }
        }
        return;
      }

      // User is logged in, navigate to appropriate page
      const buttonText = btn.textContent.trim();
      let targetPage = "";

      switch(buttonText) {
        case "Edzés":
          targetPage = "../oldalak/menupontok/Test.html";
          break;
        case "Arcápolás":
          targetPage = "../oldalak/menupontok/Arc.html";
          break;
        case "Mentális egészség":
          targetPage = "../oldalak/menupontok/Mental.html";
          break;
        default:
          return;
      }

      if (targetPage) {
        window.location.href = targetPage;
      }
    });
  });

  // Handle CTA button click based on auth status
  if (ctaJoin) {
    ctaJoin.addEventListener("click", function(e) {
      e.preventDefault();
      
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (user) {
        // User is logged in, redirect to Test page
        window.location.href = "../oldalak/menupontok/Test.html";
      } else {
        // User is not logged in, open registration modal
        const authModal = document.getElementById("auth-modal");
        const authTabs = document.querySelectorAll(".auth-tab");
        const registerForm = document.getElementById("register-form");
        const loginForm = document.getElementById("login-form");

        if (authModal) {
          authModal.classList.add("active");
          document.body.style.overflow = "hidden";

          // Switch to registration tab
          authTabs.forEach(t => t.classList.remove("active"));
          const registerTab = document.querySelector('.auth-tab[data-tab="register"]');
          if (registerTab) {
            registerTab.classList.add("active");
            registerForm.classList.add("active");
            loginForm.classList.remove("active");
          }
        }
      }
    });
  }

  // Re-enable dropdown functionality
  toggles.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const parent = btn.closest(".dropdown-checklist");
      const wasOpen = parent.classList.contains("open");
      container.querySelectorAll(".dropdown-checklist.open").forEach((el) => el.classList.remove("open"));
      if (!wasOpen) parent.classList.add("open");
    });
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest(".daily-checklist")) return;
    container.querySelectorAll(".dropdown-checklist.open").forEach((el) => el.classList.remove("open"));
  });
});
