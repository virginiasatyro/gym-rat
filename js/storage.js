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
      const workouts = mergeWithDefaults(Array.isArray(parsed) ? parsed : [], defaults);

      if (savedVersion !== currentVersion || workouts.length !== parsed.length) {
        save(workouts);
      }

      return workouts;
    } catch (error) {
      save(defaults);
      return defaults;
    }
  }

  function mergeWithDefaults(savedWorkouts, defaultWorkouts) {
    const merged = clone(savedWorkouts);
    const savedById = new Map(merged.map((workout) => [workout.id, workout]));

    defaultWorkouts.forEach((defaultWorkout) => {
      const savedWorkout = savedById.get(defaultWorkout.id);

      if (!savedWorkout) {
        merged.push(clone(defaultWorkout));
        return;
      }

      hydrateExerciseMetadata(savedWorkout, defaultWorkout);
    });

    return merged;
  }

  function hydrateExerciseMetadata(savedWorkout, defaultWorkout) {
    (defaultWorkout.workouts || []).forEach((defaultDay) => {
      const savedDay = (savedWorkout.workouts || []).find((day) => day.id === defaultDay.id);
      if (!savedDay) return;

      (defaultDay.exercises || []).forEach((defaultExercise, index) => {
        const savedExercise = (savedDay.exercises || [])[index];

        if (!savedExercise || savedExercise.type === "rest") return;

        if (!savedExercise.exerciseId && defaultExercise.exerciseId) {
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
