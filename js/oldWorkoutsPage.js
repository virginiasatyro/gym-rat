const OldWorkoutsPage = (() => {
  function init() {
    Theme.init();
    UI.renderOldWorkouts(Workouts.getOld(Storage.load()));
  }

  return {
    init
  };
})();

document.addEventListener("DOMContentLoaded", OldWorkoutsPage.init);
