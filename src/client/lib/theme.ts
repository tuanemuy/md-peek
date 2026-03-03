const THEME_KEY = "theme";

type Theme = "light" | "dark" | "system";

function getStoredTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "system";
}

function applyTheme(theme: Theme): void {
  const html = document.documentElement;
  if (theme === "dark") {
    html.classList.add("dark");
  } else if (theme === "light") {
    html.classList.remove("dark");
  } else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }
}

function updateThemeIcon(theme: Theme): void {
  const iconLight = document.getElementById("icon-theme-light");
  const iconDark = document.getElementById("icon-theme-dark");
  const iconSystem = document.getElementById("icon-theme-system");
  if (!iconLight || !iconDark || !iconSystem) return;

  iconLight.classList.add("hidden");
  iconDark.classList.add("hidden");
  iconSystem.classList.add("hidden");

  if (theme === "light") {
    iconLight.classList.remove("hidden");
  } else if (theme === "dark") {
    iconDark.classList.remove("hidden");
  } else {
    iconSystem.classList.remove("hidden");
  }
}

function nextTheme(current: Theme): Theme {
  if (current === "light") return "dark";
  if (current === "dark") return "system";
  return "light";
}

export function initTheme(): void {
  const stored = getStoredTheme();
  applyTheme(stored);
  updateThemeIcon(stored);

  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = nextTheme(getStoredTheme());
      if (next === "system") {
        localStorage.removeItem(THEME_KEY);
      } else {
        localStorage.setItem(THEME_KEY, next);
      }
      applyTheme(next);
      updateThemeIcon(next);
    });
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (getStoredTheme() === "system") {
        applyTheme("system");
      }
    });
}
