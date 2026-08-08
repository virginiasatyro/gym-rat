const Storage = (() => {
  const key = "gym-tracker-workouts";
  const versionKey = "gym-tracker-workouts-version";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDefaults() {
    if (window.CURRENT_WORKOUT) {
      return clone([window.CURRENT_WORKOUT, ...(window.OLD_WORKOUTS || [])]);
    }

    return clone(window.DEFAULT_WORKOUTS || []);
  }

  function getCurrentVersion() {
    return window.DEFAULT_WORKOUTS_VERSION || 1;
  }

  function load() {
    const defaults = getDefaults();
    const saved = localStorage.getItem(key);
    const savedVersion = localStorage.getItem(versionKey);
    const currentVersion = String(getCurrentVersion());

    if (!saved) {
      save(defaults);
      return defaults;
    }

    try {
      const parsed = JSON.parse(saved);
      const versionChanged = savedVersion !== currentVersion;
      const workouts = mergeWithDefaults(Array.isArray(parsed) ? parsed : [], defaults, versionChanged);

      if (savedVersion !== currentVersion || workouts.length !== parsed.length) {
        save(workouts);
      }

      return workouts;
    } catch (error) {
      save(defaults);
      return defaults;
    }
  }

  function mergeWithDefaults(savedWorkouts, defaultWorkouts, refreshActiveWorkout = false) {
    const merged = clone(savedWorkouts);
    const savedById = new Map(merged.map((workout) => [getWorkoutStorageKey(workout), workout]));

    defaultWorkouts.forEach((defaultWorkout) => {
      const defaultKey = getWorkoutStorageKey(defaultWorkout);
      const savedWorkout = savedById.get(defaultKey);

      if (!savedWorkout) {
        merged.push(clone(defaultWorkout));
        return;
      }

      if (refreshActiveWorkout && defaultWorkout.active) {
        const savedIndex = merged.findIndex((workout) => workout.id === defaultWorkout.id);
        merged[savedIndex] = clone(defaultWorkout);
        return;
      }

      hydrateExerciseMetadata(savedWorkout, defaultWorkout);
    });

    return merged;
  }

  function getWorkoutStorageKey(workout) {
    if (workout.active) {
      return `active:${workout.id}`;
    }

    return `${getWorkoutYear(workout)}:${workout.id}`;
  }

  function getWorkoutYear(workout) {
    const explicitYear = Number(workout.year);
    if (Number.isInteger(explicitYear)) return explicitYear;

    const nameYear = String(workout.name || "").match(/\b(20\d{2})\b/);
    if (nameYear) return Number(nameYear[1]);

    return "unknown";
  }

  function hydrateExerciseMetadata(savedWorkout, defaultWorkout) {
    (defaultWorkout.workouts || []).forEach((defaultDay) => {
      const savedDay = (savedWorkout.workouts || []).find((day) => day.id === defaultDay.id);
      if (!savedDay) return;

      (defaultDay.exercises || []).forEach((defaultExercise, index) => {
        const savedExercise = (savedDay.exercises || [])[index];

        if (!savedExercise || savedExercise.type === "rest") return;

        if (defaultExercise.exerciseId) {
          savedExercise.exerciseId = defaultExercise.exerciseId;
        }
      });
    });
  }

  function save(workouts) {
    localStorage.setItem(key, JSON.stringify(workouts));
    localStorage.setItem(versionKey, String(getCurrentVersion()));
  }

  return {
    clone,
    load,
    save
  };
})();
