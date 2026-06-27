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

    exercise.history.push({
      date: new Date().toISOString().slice(0, 10),
      weight
    });

    return workouts;
  }

  function getLastWeight(exercise) {
    if (!exercise.history.length) return null;
    return exercise.history[exercise.history.length - 1].weight;
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
    formatDate
  };
})();
