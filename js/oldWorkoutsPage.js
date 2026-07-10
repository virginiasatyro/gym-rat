const OldWorkoutsPage = (() => {
  function init() {
    const workouts = Storage.load();

    Theme.init();
    UI.renderOldWorkouts(Workouts.getOldByYear(workouts), workouts);
  }

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", OldWorkoutsPage.init);
