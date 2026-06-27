const Theme = (() => {
  const key = "gym-tracker-theme";

  function init() {
    const button = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem(key);

    setTheme(savedTheme === "dark");

    if (!button) return;

    button.addEventListener("click", () => {
      const useDark = !document.body.classList.contains("dark-theme");
      setTheme(useDark);
      localStorage.setItem(key, useDark ? "dark" : "light");
    });
  }

  function setTheme(useDark) {
    const button = document.getElementById("theme-toggle");
    document.body.classList.toggle("dark-theme", useDark);

    if (button) {
      button.textContent = useDark ? "Claro" : "Escuro";
    }
  }

  return {
    init
  };
})();
