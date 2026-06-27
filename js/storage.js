const Storage = (() => {
  const key = "gym-tracker-workouts";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function load() {
    const saved = localStorage.getItem(key);

    if (!saved) {
      const defaults = clone(window.DEFAULT_WORKOUTS || []);
      save(defaults);
      return defaults;
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      const defaults = clone(window.DEFAULT_WORKOUTS || []);
      save(defaults);
      return defaults;
    }
  }

  function save(workouts) {
    localStorage.setItem(key, JSON.stringify(workouts));
  }

  return {
    load,
    save
  };
})();
