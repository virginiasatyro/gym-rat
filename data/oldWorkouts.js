window.OLD_WORKOUTS_BY_YEAR = {
  2023: window.OLD_WORKOUTS_2023 || [],
  2024: window.OLD_WORKOUTS_2024 || [],
  2025: window.OLD_WORKOUTS_2025 || [],
  2026: window.OLD_WORKOUTS_2026 || []
};

window.OLD_WORKOUTS = Object.values(window.OLD_WORKOUTS_BY_YEAR).flat();
