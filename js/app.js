const App = (() => {
  const themeKey = "gym-tracker-theme";
  const state = {
    workouts: Storage.load(),
    selectedDayId: "A"
  };

  function init() {
    const activeWorkout = Workouts.getActive(state.workouts);
    state.selectedDayId = activeWorkout.workouts[0].id;
    initTheme();
    render();
  }

  function render() {
    UI.render(state, {
      selectDay,
      saveWeight
    });
  }

  function selectDay(dayId) {
    state.selectedDayId = dayId;
    render();
  }

  function saveWeight(workoutId, dayId, exerciseId, weight) {
    state.workouts = Workouts.addWeight(state.workouts, workoutId, dayId, exerciseId, weight);
    Storage.save(state.workouts);
    render();
  }

  function initTheme() {
    const savedTheme = localStorage.getItem(themeKey);
    const useDark = savedTheme === "dark";
    const button = document.getElementById("theme-toggle");

    setTheme(useDark);

    button.addEventListener("click", () => {
      const nextUseDark = !document.body.classList.contains("dark-theme");
      setTheme(nextUseDark);
      localStorage.setItem(themeKey, nextUseDark ? "dark" : "light");
    });
  }

  function setTheme(useDark) {
    const button = document.getElementById("theme-toggle");
    document.body.classList.toggle("dark-theme", useDark);
    button.textContent = useDark ? "Claro" : "Escuro";
  }

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
