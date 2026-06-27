const Backup = (() => {
  function init(actions) {
    const exportButton = document.getElementById("export-backup");
    const exportCurrentOldButton = document.getElementById("export-current-old");
    const importButton = document.getElementById("import-backup");
    const textarea = document.getElementById("backup-json");
    const status = document.getElementById("backup-status");

    if (!exportButton || !exportCurrentOldButton || !importButton || !textarea || !status) return;

    exportButton.addEventListener("click", () => {
      const workouts = actions.getWorkouts();
      textarea.value = JSON.stringify(createBackup(workouts), null, 2);
      status.textContent = "Backup exportado.";
    });

    exportCurrentOldButton.addEventListener("click", () => {
      const currentAsOldWorkout = createCurrentAsOldWorkout(actions.getWorkouts());
      textarea.value = JSON.stringify(currentAsOldWorkout, null, 2);
      status.textContent = "Treino atual exportado como antigo.";
    });

    importButton.addEventListener("click", () => {
      try {
        const workouts = parseBackup(textarea.value);
        actions.setWorkouts(workouts);
        status.textContent = "Backup importado.";
      } catch (error) {
        status.textContent = "JSON invalido ou sem treinos.";
      }
    });
  }

  function createBackup(workouts) {
    const activeWorkout = Workouts.getActive(workouts);

    return {
      app: "gym-tracker",
      exportedAt: new Date().toISOString(),
      workouts,
      currentWorkout: activeWorkout || null,
      oldWorkouts: Workouts.getOld(workouts),
      currentAsOldWorkout: createCurrentAsOldWorkout(workouts)
    };
  }

  function createCurrentAsOldWorkout(workouts) {
    const activeWorkout = Workouts.getActive(workouts);

    if (!activeWorkout) return null;

    return {
      ...Storage.clone(activeWorkout),
      active: false
    };
  }

  function parseBackup(value) {
    const data = JSON.parse(value);
    const workouts = Array.isArray(data) ? data : data.workouts;

    if (!Array.isArray(workouts) || !workouts.length) {
      throw new Error("Invalid backup");
    }

    return workouts;
  }

  return {
    init
  };
})();
