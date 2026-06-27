const App = (() => {
  const state = {
    workouts: Storage.load(),
    selectedDayId: "A"
  };

  function init() {
    const activeWorkout = Workouts.getActive(state.workouts);
    state.selectedDayId = activeWorkout.workouts[0].id;
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

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", App.init);
