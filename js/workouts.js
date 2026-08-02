const Workouts = (() => {
  function getActive(workouts) {
    return workouts.find((workout) => workout.active) || workouts[0];
  }

  function getOld(workouts) {
    return workouts.filter((workout) => !workout.active);
  }

  function getOldByYear(workouts) {
    const years = [2026, 2025, 2024, 2023];
    const groups = new Map(years.map((year) => [year, []]));

    getOld(workouts).forEach((workout) => {
      const year = getWorkoutYear(workout);

      if (!groups.has(year)) {
        groups.set(year, []);
      }

      groups.get(year).push(workout);
    });

    return Array.from(groups.entries())
      .sort((first, second) => second[0] - first[0])
      .map(([year, yearWorkouts]) => ({
        year,
        workouts: yearWorkouts
      }));
  }

  function getWorkoutYear(workout) {
    const explicitYear = Number(workout.year);
    if (Number.isInteger(explicitYear)) return explicitYear;

    const nameYear = String(workout.name || "").match(/\b(20\d{2})\b/);
    if (nameYear) return Number(nameYear[1]);

    const historyYear = findFirstHistoryYear(workout);
    if (historyYear) return historyYear;

    return new Date().getFullYear();
  }

  function findFirstHistoryYear(workout) {
    for (const day of workout.workouts || []) {
      for (const exercise of day.exercises || []) {
        const datedEntry = (exercise.history || []).find((entry) => /^\d{4}-/.test(String(entry.date || "")));
        if (datedEntry) return Number(String(datedEntry.date).slice(0, 4));

        if (/^\d{4}-/.test(String(exercise.lastWeightDate || ""))) {
          return Number(String(exercise.lastWeightDate).slice(0, 4));
        }
      }
    }

    return null;
  }

  function findDay(workout, dayId) {
    return workout.workouts.find((day) => day.id === dayId) || workout.workouts[0];
  }

  function ensureDayStatus(day) {
    if (!day.status || typeof day.status !== "object") {
      day.status = {};
    }

    if (typeof day.status.planned !== "boolean") {
      day.status.planned = false;
    }

    if (typeof day.status.trained !== "boolean") {
      day.status.trained = false;
    }

    if (typeof day.status.plannedDate !== "string" || !day.status.plannedDate) {
      day.status.plannedDate = null;
    }

    if (typeof day.status.trainedDate !== "string" || !day.status.trainedDate) {
      day.status.trainedDate = null;
    }

    if (typeof day.status.trainingCount !== "number" || Number.isNaN(day.status.trainingCount)) {
      day.status.trainingCount = 0;
    }

    if (typeof day.status.comment !== "string") {
      day.status.comment = "";
    }

    return day.status;
  }

  function getDayStatus(day) {
    return ensureDayStatus(day);
  }

  function canEditWeights(day) {
    const status = getDayStatus(day);
    return Boolean(status.trained);
  }

  function markDayStatus(workouts, workoutId, dayId, type) {
    const workout = workouts.find((item) => item.id === workoutId);
    if (!workout) return workouts;

    const day = findDay(workout, dayId);
    if (!day) return workouts;

    const status = ensureDayStatus(day);
    const today = new Date().toISOString().slice(0, 10);

    if (type === "plan") {
      status.planned = true;
      status.plannedDate = today;
      return workouts;
    }

    if (type === "train") {
      const alreadyTrainedToday = workouts.some((candidateWorkout) => {
        const candidateDay = findDay(candidateWorkout, dayId);
        if (!candidateDay || candidateWorkout.id === workoutId) return false;
        const candidateStatus = getDayStatus(candidateDay);
        return Boolean(candidateStatus.trained && candidateStatus.trainedDate === today);
      });

      if (alreadyTrainedToday) {
        return workouts;
      }

      if (status.trained && status.trainedDate === today) {
        status.trained = false;
        status.trainingCount = Math.max((Number(status.trainingCount) || 0) - 1, 0);
        return workouts;
      }

      status.planned = true;
      status.plannedDate = status.plannedDate || today;
      status.trained = true;
      status.trainedDate = today;
      status.trainingCount = (Number(status.trainingCount) || 0) + 1;

      (day.exercises || []).forEach((exercise) => {
        const lastWeight = getLastWeight(exercise);
        if (lastWeight !== null) {
          addWeight(workouts, workoutId, dayId, exercise.id, lastWeight);
        }
      });

      return workouts;
    }

    return workouts;
  }

  function saveExerciseComment(workouts, workoutId, dayId, exerciseId, comment) {
    const workout = workouts.find((item) => item.id === workoutId);
    if (!workout) return workouts;

    const day = findDay(workout, dayId);
    if (!day) return workouts;

    const exercise = (day.exercises || []).find((item) => item.id === exerciseId);
    if (!exercise) return workouts;

    exercise.comment = String(comment || "").trim();
    return workouts;
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

    const today = new Date().toISOString().slice(0, 10);
    const lastEntry = exercise.history[exercise.history.length - 1];

    if (lastEntry && lastEntry.date === today) {
      lastEntry.weight = weight;
    } else {
      exercise.history.push({
        date: today,
        weight
      });
    }
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
    const exerciseName = normalizeName(getExerciseName(exercise));
    const matches = [];

    workouts.forEach((workout) => {
      (workout.workouts || []).forEach((day) => {
        (day.exercises || []).forEach((candidate) => {
          const sameStableId = stableId && getStableExerciseId(candidate) === stableId;
          const sameNameWithoutStableId = !stableId && normalizeName(getExerciseName(candidate)) === exerciseName;

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
    return window.EXERCISE_CATALOG_BY_NAME?.[normalizeName(getExerciseName(exercise))] || null;
  }

  function getExerciseName(exercise) {
    if (exercise.exerciseId && window.EXERCISE_CATALOG_BY_ID?.[exercise.exerciseId]) {
      return window.EXERCISE_CATALOG_BY_ID[exercise.exerciseId].name;
    }

    return exercise.name || "";
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

  function getEvolution(exercise) {
    const entries = getWeightEntries(exercise);
    if (entries.length < 2) return null;

    const first = entries[0].weight;
    const current = entries[entries.length - 1].weight;

    if (first === null || current === null) return null;

    return current - first;
  }

  function formatDate(date) {
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}/${month}`;
  }

  return {
    addWeight,
    canEditWeights,
    findDay,
    getActive,
    getDayStatus,
    getEvolution,
    getLastWeight,
    getOld,
    getOldByYear,
    getExerciseName,
    getPrCategories,
    getStableExerciseId,
    getStats,
    markDayStatus,
    saveExerciseComment,
    formatWeight,
    formatDate
  };
})();
