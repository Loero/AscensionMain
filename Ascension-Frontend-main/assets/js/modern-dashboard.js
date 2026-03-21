// ================================
// ASCENSION SYSTEM - ULTRA-DARK LOOKSMAXXING DASHBOARD
// Masculine interactions and animations
// ================================

document.addEventListener("DOMContentLoaded", function () {
  // Animate progress bars on load
  animateProgressBars();

  // Initialize card interactions
  initCardInteractions();

  // Initialize hover effects
  initHoverEffects();

  // Add crimson glow effects
  initCrimsonGlow();
});

// Animate progress bars on load
function animateProgressBars() {
  // Animate main daily progress bar
  const dailyProgress = document.querySelector(".daily-progress-fill");
  if (dailyProgress) {
    const targetWidth =
      Number.parseInt(
        dailyProgress.dataset.target || dailyProgress.style.width || "0",
        10,
      ) || 0;
    if (targetWidth > 0) {
      dailyProgress.style.width = "0%";

      setTimeout(() => {
        dailyProgress.style.width = targetWidth + "%";
        updateProgressLabel(targetWidth);
      }, 500);
    }
  }

  // Animate task progress bars
  const taskProgressBars = document.querySelectorAll(".task-progress-fill");
  taskProgressBars.forEach((bar, index) => {
    const targetProgress =
      Number.parseInt(bar.dataset.target || bar.style.width || "0", 10) || 0;
    if (targetProgress > 0) {
      animateTaskProgressBar(bar, targetProgress, index);
    }
  });
}

function updateProgressLabel(percentage) {
  const label = document.querySelector(".daily-progress-label");
  if (label) {
    const completed = Math.floor((percentage / 33.33) * 3); // 3 tasks total
    label.textContent = `Daily Progress – ${completed}/3 completed (${Math.round(percentage)}%)`;
  }
}

function animateTaskProgressBar(bar, targetProgress, index) {
  const progressText = bar
    .closest(".task-progress")
    .querySelector(".task-progress-text");
  let currentProgress = 0;

  setTimeout(
    () => {
      const animation = setInterval(() => {
        currentProgress += 1;

        if (currentProgress >= targetProgress) {
          currentProgress = targetProgress;
          clearInterval(animation);
        }

        bar.style.width = currentProgress + "%";
        if (progressText && progressText.dataset.locked !== "1") {
          progressText.textContent = currentProgress + "% Complete";
        }
      }, 20);
    },
    800 + index * 200,
  );
}

// Initialize card interactions
function initCardInteractions() {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card) => {
    // Add hover effect with crimson glow
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-4px)";
      this.style.boxShadow =
        "0 8px 32px rgba(0, 0, 0, 0.9), 0 0 20px rgba(183, 28, 28, 0.2)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "0 4px 24px rgba(0, 0, 0, 0.8)";
    });

    // Add click feedback for buttons
    const buttons = card.querySelectorAll(".btn");
    buttons.forEach((button) => {
      button.addEventListener("click", function (e) {
        // Add aggressive scale effect
        this.style.transform = "scale(0.96)";
        setTimeout(() => {
          this.style.transform = "";
        }, 100);

        // Handle navigation
        const buttonText = this.textContent.trim();
        handleButtonClick(buttonText);
      });
    });
  });
}

// Initialize hover effects
function initHoverEffects() {
  // Add smooth transitions to all interactive elements
  const interactiveElements = document.querySelectorAll(".btn, .card");
  interactiveElements.forEach((element) => {
    element.style.transition = "all 0.15s ease";
  });
}

// Initialize crimson glow effects
function initCrimsonGlow() {
  // Add subtle pulsing glow to active elements
  const progressBars = document.querySelectorAll(
    ".daily-progress-fill, .task-progress-fill",
  );
  progressBars.forEach((bar) => {
    setInterval(() => {
      bar.style.boxShadow = `inset 0 0 ${Math.random() * 4 + 4}px rgba(183, 28, 28, 0.3)`;
    }, 2000);
  });
}

// Handle button clicks
function handleButtonClick(buttonText) {
  console.log("Button clicked:", buttonText);

  // Add navigation logic
  switch (buttonText) {
    case "Edzés Beállítása":
      window.location.href = "./menupontok/Test.html";
      break;
    case "Rutin Készítése":
      window.location.href = "./menupontok/Arc.html";
      break;
    case "Gyakorlat Választása":
      window.location.href = "./menupontok/Mental.html";
      break;
    default:
      console.log("Unknown button action");
  }
}

// Animate stats on load
function animateStats() {
  const statValues = document.querySelectorAll(".stat-value");

  statValues.forEach((stat) => {
    const finalValue = stat.textContent;
    const isDecimal = finalValue.includes(".");
    const isPercent = finalValue.includes("%");
    const targetValue = parseFloat(finalValue);

    if (isNaN(targetValue)) return;

    let currentValue = 0;
    const increment = targetValue / 25; // Faster, more aggressive animation

    const animation = setInterval(() => {
      currentValue += increment;

      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(animation);
      }

      if (isDecimal) {
        stat.textContent = currentValue.toFixed(1) + (isPercent ? "%" : "");
      } else {
        stat.textContent = Math.round(currentValue) + (isPercent ? "%" : "");
      }
    }, 25);
  });
}

// Initialize stats animation
window.addEventListener("load", () => {
  setTimeout(animateStats, 800);
});

// Add keyboard navigation
document.addEventListener("keydown", function (e) {
  // Press '1', '2', '3' to navigate to different sections
  if (e.key === "1") {
    window.location.href = "./menupontok/Test.html";
  } else if (e.key === "2") {
    window.location.href = "./menupontok/Arc.html";
  } else if (e.key === "3") {
    window.location.href = "./menupontok/Mental.html";
  }
});

// Add aggressive notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add notification styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        background: #0A0A0A;
        color: #F5F5F5;
        border-radius: 8px;
        border-left: 3px solid #B71C1C;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.8), 0 0 20px rgba(183, 28, 28, 0.2);
        z-index: 1000;
        transform: translateX(400px);
        transition: transform 0.15s ease;
        font-size: 0.875rem;
        max-width: 300px;
        font-weight: 600;
    `;

  document.body.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.style.transform = "translateX(0)";
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(400px)";
    setTimeout(() => {
      notification.remove();
    }, 150);
  }, 3000);
}

// Export functions for global access
window.AscensionDashboard = {
  showNotification,
  animateStats,
  animateProgressBars,
};
