(function () {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem("site-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  root.dataset.theme = storedTheme || (prefersDark ? "dark" : "light");

  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = nextTheme;
      localStorage.setItem("site-theme", nextTheme);
    });
  });

  const headers = document.querySelectorAll("[data-elevate]");
  const updateHeader = () => {
    headers.forEach((header) => {
      header.classList.toggle("is-elevated", window.scrollY > 8);
    });
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
})();
