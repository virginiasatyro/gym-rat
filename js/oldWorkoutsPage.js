const OldWorkoutsPage = (() => {
  function init() {
    const workouts = Storage.load();

    Theme.init();
    UI.renderOldWorkouts(Workouts.getOld(workouts), workouts);
  }

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", OldWorkoutsPage.init);
