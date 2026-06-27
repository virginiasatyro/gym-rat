const Workouts = (() => {
  function getActive(workouts) {
    return workouts.find((workout) => workout.active) || workouts[0];
  }

  function getOld(workouts) {
    return workouts.filter((workout) => !workout.active);
  }

  function findDay(workout, dayId) {
    return workout.workouts.find((day) => day.id === dayId) || workout.workouts[0];
  }

  function findExercise(workouts, workoutId, dayId, exerciseId) {
    const workout = workouts.find((item) => item.id === workoutId);
    if (!workout) return null;

    const day = findDay(workout, dayId);
    if (!day) return null;

    return day.exercises.find((exercise) => exercise.id === exerciseId) || null;
  }

  function addWeight(workouts, workoutId, dayId, exerciseId, weight) {
    const exercise = findExercise(workouts, workoutId, dayId, exerciseId);
    if (!exercise) return workouts;

    if (!Array.isArray(exercise.history)) {
      exercise.history = [];
    }

    exercise.history.push({
      date: new Date().toISOString().slice(0, 10),
      weight
    });
    exercise.lastWeight = weight;

    return workouts;
  }

  function getLastWeight(exercise) {
    const lastWeight = Number(exercise.lastWeight);

    if (Number.isFinite(lastWeight)) {
      return lastWeight;
    }

    const entries = getWeightEntries(exercise);
    if (!entries.length) return null;
    return entries[entries.length - 1].weight;
  }

  function getStats(exercise) {
    const entries = getWeightEntries(exercise);

    if (!entries.length) {
      return {
        count: 0,
        average: null,
        pr: null
      };
    }

    const weights = entries.map((entry) => Number(entry.weight));
    const total = weights.reduce((sum, weight) => sum + weight, 0);

    return {
      count: weights.length,
      average: total / weights.length,
      pr: Math.max(...weights)
    };
  }

  function getPrCategories(exercise, workouts = []) {
    const categories = {
      low: null,
      medium: null,
      high: null
    };

    const matchingExercises = getMatchingExercises(workouts, exercise);

    if (!matchingExercises.length) {
      matchingExercises.push(exercise);
    }

    matchingExercises.forEach((matchingExercise) => {
      const stats = getStats(matchingExercise);
      const category = getRepCategory(matchingExercise.reps);

      if (!category || stats.pr === null) return;

      categories[category] = Math.max(categories[category] || 0, stats.pr);
    });

    return categories;
  }

  function getMatchingExercises(workouts, exercise) {
    const stableId = getStableExerciseId(exercise);
    const exerciseName = normalizeName(exercise.name);
    const matches = [];

    workouts.forEach((workout) => {
      (workout.workouts || []).forEach((day) => {
        (day.exercises || []).forEach((candidate) => {
          const sameStableId = stableId && getStableExerciseId(candidate) === stableId;
          const sameNameWithoutStableId = !stableId && normalizeName(candidate.name) === exerciseName;

          if (sameStableId || sameNameWithoutStableId) {
            matches.push(candidate);
          }
        });
      });
    });

    return matches;
  }

  function normalizeName(name) {
    return String(name)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function getStableExerciseId(exercise) {
    if (exercise.exerciseId) return exercise.exerciseId;
    return window.EXERCISE_CATALOG_BY_NAME?.[normalizeName(exercise.name)] || null;
  }

  function getRepCategory(reps) {
    const repValue = getRepValue(reps);

    if (repValue === null) return null;
    if (repValue < 8) return "low";
    if (repValue <= 12) return "medium";
    return "high";
  }

  function getRepValue(reps) {
    const values = String(reps).match(/\d+(\.\d+)?/g);
    if (!values) return null;

    const numbers = values.map(Number);
    const total = numbers.reduce((sum, number) => sum + number, 0);
    return total / numbers.length;
  }

  function getWeightTrend(exercise) {
    const history = getWeightEntries(exercise);

    if (history.length < 2) {
      return {
        label: "Sem comparacao",
        type: "neutral"
      };
    }

    const previous = Number(history[history.length - 2].weight);
    const current = Number(history[history.length - 1].weight);
    const difference = current - previous;

    if (difference > 0) {
      return {
        label: `+${formatWeight(difference)} kg`,
        type: "up"
      };
    }

    if (difference < 0) {
      return {
        label: `${formatWeight(difference)} kg`,
        type: "down"
      };
    }

    return {
      label: "Igual",
      type: "neutral"
    };
  }

  function formatWeight(weight) {
    const value = Number(weight);
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function getWeightEntries(exercise) {
    const history = Array.isArray(exercise.history) ? [...exercise.history] : [];
    const lastWeight = Number(exercise.lastWeight);
    const lastHistoryWeight = history.length ? Number(history[history.length - 1].weight) : null;

    if (Number.isFinite(lastWeight) && lastWeight !== lastHistoryWeight) {
      history.push({
        date: exercise.lastWeightDate || "",
        weight: lastWeight
      });
    }

    return history.filter((entry) => Number.isFinite(Number(entry.weight)));
  }

  function formatDate(date) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}`;
  }

  return {
    addWeight,
    findDay,
    getActive,
    getLastWeight,
    getOld,
    getPrCategories,
    getStableExerciseId,
    getStats,
    getWeightTrend,
    formatWeight,
    formatDate
  };
})();
