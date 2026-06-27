const Storage = (() => {
  const key = "gym-tracker-workouts";
  const versionKey = "gym-tracker-workouts-version";

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getDefaults() {
    if (window.CURRENT_WORKOUT) {
      return clone([window.CURRENT_WORKOUT, ...(window.OLD_WORKOUTS || [])]);
    }

    return clone(window.DEFAULT_WORKOUTS || []);
  }

  function getCurrentVersion() {
    return window.DEFAULT_WORKOUTS_VERSION || 1;
  }

  function load() {
    const defaults = getDefaults();
    const saved = localStorage.getItem(key);
    const savedVersion = localStorage.getItem(versionKey);
    const currentVersion = String(getCurrentVersion());

    if (!saved || savedVersion !== currentVersion) {
      save(defaults);
      return defaults;
    }

    try {
      return JSON.parse(saved);
    } catch (error) {
      save(defaults);
      return defaults;
    }
  }

  function save(workouts) {
    localStorage.setItem(key, JSON.stringify(workouts));
    localStorage.setItem(versionKey, String(getCurrentVersion()));
  }

  return {
    load,
    save
  };
})();
