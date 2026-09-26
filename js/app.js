const App = (() => {
  const state = {
    workouts: Storage.load(),
    selectedDayId: "A"
  };

  function init() {
    const activeWorkout = Workouts.getActive(state.workouts);
    state.selectedDayId = activeWorkout.workouts[0].id;
    Theme.init();
    Backup.init({
      getWorkouts: () => state.workouts,
      setWorkouts
    });
    render();
  }

  function render() {
    UI.render(state, {
      selectDay,
      saveWeight,
      markDayStatus,
      saveExerciseComment
    });
  }

  function selectDay(dayId) {
    state.selectedDayId = dayId;
    render();
  }

  function saveWeight(workoutId, dayId, exerciseId, weight, unit) {
    const workout = state.workouts.find((item) => item.id === workoutId);
    const day = workout ? Workouts.findDay(workout, dayId) : null;

    if (!day || !Workouts.canEditWeights(day)) {
      return;
    }

    const resolvedUnit = unit === "lb" ? "lb" : "kg";
    const weightKg = Workouts.toStorageKg(weight, resolvedUnit);

    state.workouts = Workouts.addWeight(state.workouts, workoutId, dayId, exerciseId, weightKg);
    state.workouts = Workouts.setExerciseUnit(state.workouts, workoutId, dayId, exerciseId, resolvedUnit);
    Storage.save(state.workouts);
    render();
  }

  function markDayStatus(workoutId, dayId, type) {
    state.workouts = Workouts.markDayStatus(state.workouts, workoutId, dayId, type);
    Storage.save(state.workouts);
    render();
  }

  function saveExerciseComment(workoutId, dayId, exerciseId, comment) {
    state.workouts = Workouts.saveExerciseComment(state.workouts, workoutId, dayId, exerciseId, comment);
    Storage.save(state.workouts);
    render();
  }

  function setWorkouts(workouts) {
    state.workouts = workouts;

    const activeWorkout = Workouts.getActive(state.workouts);
    state.selectedDayId = activeWorkout.workouts[0].id;

    Storage.save(state.workouts);
    render();
  }

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
