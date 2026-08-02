const UI = (() => {
  let timers = {};

  function render(state, actions) {
    const activeWorkout = Workouts.getActive(state.workouts);
    document.getElementById("active-workout-name").textContent = activeWorkout.name;

    renderTabs(activeWorkout, state.selectedDayId, actions);
    renderCurrentDay(activeWorkout, state.selectedDayId, actions, state.workouts);
  }

  function renderTabs(activeWorkout, selectedDayId, actions) {
    const tabs = document.getElementById("day-tabs");
    tabs.innerHTML = "";

    activeWorkout.workouts.forEach((day) => {
      const button = document.createElement("button");
      button.className = `day-tab day-${day.id.toLowerCase()}${day.id === selectedDayId ? " is-active" : ""}`;
      button.type = "button";
      button.textContent = day.id;
      button.setAttribute("aria-label", day.name);
      button.addEventListener("click", () => actions.selectDay(day.id));
      tabs.appendChild(button);
    });
  }

  function renderCurrentDay(activeWorkout, selectedDayId, actions, allWorkouts) {
    const container = document.getElementById("current-day");
    const day = Workouts.findDay(activeWorkout, selectedDayId);

    container.innerHTML = "";

    const title = document.createElement("h2");
    title.className = "workout-title";
    title.textContent = day.name;
    container.appendChild(title);

    const dayStatusCard = renderDayStatus(activeWorkout.id, day, actions);
    container.appendChild(dayStatusCard);

    const list = document.createElement("div");
    list.className = "exercise-list";

    buildExerciseGroups(day.exercises).forEach((group) => {
      list.appendChild(renderExerciseGroup(activeWorkout.id, day.id, group, false, Workouts.canEditWeights(day), actions, allWorkouts, day));
    });

    container.appendChild(list);
  }

  function renderDayStatus(workoutId, day, actions) {
    const status = Workouts.getDayStatus(day);
    const card = document.createElement("section");
    card.className = "day-status-card";

    const today = new Date().toISOString().slice(0, 10);
    const trainedToday = status.trained && status.trainedDate === today;
    const trainingCount = Number(status.trainingCount) || 0;
    const summary = trainedToday
      ? `Treinada hoje · ${trainingCount}x treinada`
      : status.trainedDate
        ? `Treinada ${formatWeekday(status.trainedDate)}`
        : "Ficha nova";

    const actionsRow = document.createElement("div");
    actionsRow.className = "day-status-actions";

    const trainButton = document.createElement("button");
    trainButton.className = `status-button${trainedToday ? " is-active" : ""}`;
    trainButton.type = "button";
    trainButton.textContent = trainedToday ? "Treinada ✔" : "Status";
    trainButton.addEventListener("click", () => {
      actions.markDayStatus(workoutId, day.id, "train");
    });
    actionsRow.appendChild(trainButton);

    card.innerHTML = `
      <div class="day-status-copy">
        <h3>Status da ficha</h3>
        <p>${escapeHtml(summary)}</p>
      </div>
    `;
    card.appendChild(actionsRow);

    return card;
  }

  function renderExerciseGroup(workoutId, dayId, group, readonly, canEditWeights, actions, allWorkouts = [], day = null) {
    const exercises = group.exercises || [];

    if (!isConjugatedGroup(group)) {
      const fragment = document.createDocumentFragment();

      exercises.forEach((exercise) => {
        fragment.appendChild(renderExercise(workoutId, dayId, exercise, readonly, canEditWeights, actions, allWorkouts, day));
      });

      return fragment;
    }

    const wrapper = document.createElement("section");
    wrapper.className = "conjugated-group";

    const title = document.createElement("h4");
    title.className = "conjugated-group-title";
    title.textContent = "Treino conjugado";
    wrapper.appendChild(title);

    const items = document.createElement("div");
    items.className = "conjugated-group-items";

    exercises.forEach((exercise) => {
      const item = document.createElement("div");
      item.className = "conjugated-group-item";
      item.appendChild(renderExercise(workoutId, dayId, exercise, readonly, canEditWeights, actions, allWorkouts, day));
      items.appendChild(item);
    });

    wrapper.appendChild(items);
    return wrapper;
  }

  function buildExerciseGroups(exercises = []) {
    const groups = [];
    let currentGroup = [];

    exercises.forEach((exercise) => {
      if (exercise.type === "rest") {
        if (currentGroup.length) {
          groups.push({
            conjugated: currentGroup.length >= 2,
            exercises: currentGroup
          });
          currentGroup = [];
        }
        return;
      }

      currentGroup.push(exercise);
    });

    if (currentGroup.length) {
      groups.push({
        conjugated: false,
        exercises: currentGroup
      });
    }

    return groups;
  }

  function isConjugatedGroup(group = []) {
    return Boolean(group.conjugated);
  }

  function renderExercise(workoutId, dayId, exercise, readonly, canEditWeights, actions, allWorkouts = [], day = null) {
    if (exercise.type === "rest") {
      const card = document.createElement("article");
      card.className = "exercise-card rest-card";
      card.innerHTML = `
        <div class="exercise-header">
          <div>
            <h3 class="exercise-title">${escapeHtml(exercise.name)}</h3>
            <p class="exercise-meta">Descanso de ${escapeHtml(exercise.duration)} s</p>
          </div>
        </div>
      `;
      return card;
    }

    const card = document.createElement("article");
    card.className = "exercise-card";

    const lastWeight = Workouts.getLastWeight(exercise);
    const exerciseName = Workouts.getExerciseName(exercise);
    const restLabel = exercise.rest != null && exercise.rest !== "" ? ` · Descanso: ${exercise.rest} s` : "";
    const stats = Workouts.getStats(exercise);
    const prCategories = Workouts.getPrCategories(exercise, allWorkouts);
    const trend = Workouts.getWeightTrend(exercise);
    const historyId = `history-${workoutId}-${dayId}-${exercise.id}`;
    const timerId = `timer-${workoutId}-${dayId}-${exercise.id}`;
    const status = Workouts.getDayStatus(day || { status: {} });

    card.innerHTML = `
      <div class="exercise-header">
        <div>
          <h3 class="exercise-title">${escapeHtml(exerciseName)}</h3>
          <p class="exercise-meta">${exercise.sets}x${escapeHtml(exercise.reps)}${restLabel}</p>
        </div>
        <div class="last-weight">
          <span>Ultimo peso</span>
          <strong>${lastWeight === null ? "-" : `${Workouts.formatWeight(lastWeight)} kg`}</strong>
        </div>
      </div>
      <dl class="exercise-stats">
        <div>
          <dt>Evolucao &lt;8</dt>
          <dd>${prCategories.low === null ? "-" : `${formatPrGain(prCategories.low)} kg`}</dd>
        </div>
        <div>
          <dt>Evolucao 8-12</dt>
          <dd>${prCategories.medium === null ? "-" : `${formatPrGain(prCategories.medium)} kg`}</dd>
        </div>
        <div>
          <dt>Evolucao &gt;12</dt>
          <dd>${prCategories.high === null ? "-" : `${formatPrGain(prCategories.high)} kg`}</dd>
        </div>
        <div>
          <dt>Variacao</dt>
          <dd class="trend trend-${trend.type}">${escapeHtml(trend.label)}</dd>
        </div>
        <div>
          <dt>Media</dt>
          <dd>${stats.average === null ? "-" : `${Workouts.formatWeight(stats.average)} kg`}</dd>
        </div>
        <div class="comment-stat">
          <dt>Comentário</dt>
          <dd class="comment-cell">
            <input class="comment-input" type="text" value="${escapeHtml(exercise.comment || "")}" placeholder="Comentário do exercício">
          </dd>
        </div>
      </dl>
    `;

    if (!readonly && canEditWeights) {
      const form = document.createElement("form");
      form.className = "weight-form";
      form.innerHTML = `
        <input class="weight-input" type="number" min="0" step="0.5" inputmode="decimal" placeholder="Novo peso">
        <button class="save-button save-${dayId.toLowerCase()}" type="submit">Salvar</button>
      `;

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("input");
        const value = Number(input.value);

        if (!Number.isFinite(value) || value <= 0) {
          input.focus();
          return;
        }

        actions.saveWeight(workoutId, dayId, exercise.id, value);
      });

      card.appendChild(form);
    } else {
      const note = document.createElement("p");
      note.className = "readonly-note";
      note.textContent = readonly
        ? "Somente visualizacao."
        : "Marque o treino do dia para editar pesos.";
      card.appendChild(note);
    }

    const commentInput = card.querySelector(".comment-input");
    if (commentInput) {
      commentInput.addEventListener("blur", () => {
        actions.saveExerciseComment(workoutId, dayId, exercise.id, commentInput.value);
      });

      commentInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          commentInput.blur();
        }
      });
    }

    const actionsRow = document.createElement("div");
    actionsRow.className = "exercise-actions";

    const historyButton = document.createElement("button");
    historyButton.className = "history-button";
    historyButton.type = "button";
    historyButton.textContent = "Historico";
    historyButton.addEventListener("click", () => {
      document.getElementById(historyId).classList.toggle("is-open");
    });
    actionsRow.appendChild(historyButton);

    card.appendChild(actionsRow);

    const history = document.createElement("div");
    history.className = "history";
    history.id = historyId;
    history.appendChild(renderHistory(exercise.history || []));
    card.appendChild(history);

    return card;
  }

  function renderHistory(history) {
    if (!history.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhum peso registrado.";
      return empty;
    }

    const list = document.createElement("ul");
    list.className = "history-list";

    history.forEach((entry) => {
      const item = document.createElement("li");
      item.innerHTML = `<span>${Workouts.formatDate(entry.date)}</span><strong>${Workouts.formatWeight(entry.weight)} kg</strong>`;
      list.appendChild(item);
    });

    return list;
  }

  function renderOldWorkouts(oldWorkoutYears, allWorkouts = []) {
    const container = document.getElementById("old-workouts");
    container.innerHTML = "";

    if (!oldWorkoutYears.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "Nenhum treino antigo cadastrado.";
      container.appendChild(empty);
      return;
    }

    oldWorkoutYears.forEach((yearGroup) => {
      const yearPanel = document.createElement("section");
      yearPanel.className = "old-year-panel";

      const yearContentId = `old-year-${yearGroup.year}`;
      const yearButton = document.createElement("button");
      yearButton.className = "old-year-button";
      yearButton.type = "button";
      yearButton.innerHTML = `<span>${escapeHtml(yearGroup.year)}</span><span>${yearGroup.workouts.length} treino${yearGroup.workouts.length === 1 ? "" : "s"}</span>`;
      yearButton.addEventListener("click", () => {
        document.getElementById(yearContentId).classList.toggle("is-open");
      });

      const yearContent = document.createElement("div");
      yearContent.className = "old-year-content";
      yearContent.id = yearContentId;

      if (!yearGroup.workouts.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state old-year-empty";
        empty.textContent = "Nenhum treino cadastrado neste ano.";
        yearContent.appendChild(empty);
      }

      yearGroup.workouts.forEach((workout) => {
        const panel = document.createElement("article");
        panel.className = "old-workout-panel";

        const contentId = `old-${workout.id}`;
        const button = document.createElement("button");
        button.className = "old-button";
        button.type = "button";
        button.innerHTML = `<span>${escapeHtml(workout.name)}</span><span>Ver</span>`;
        button.addEventListener("click", () => {
          document.getElementById(contentId).classList.toggle("is-open");
        });

        const content = document.createElement("div");
        content.className = "old-content";
        content.id = contentId;

        workout.workouts.forEach((day) => {
          const dayBlock = document.createElement("section");
          dayBlock.className = "old-day";
          dayBlock.innerHTML = `<h3>${escapeHtml(day.name)}</h3>`;

          buildExerciseGroups(day.exercises).forEach((group) => {
            const item = document.createElement("div");
            item.className = "old-exercise";
            item.appendChild(renderExerciseGroup(workout.id, day.id, group, true, false, {}, allWorkouts, day));
            dayBlock.appendChild(item);
          });

          content.appendChild(dayBlock);
        });

        panel.appendChild(button);
        panel.appendChild(content);
        yearContent.appendChild(panel);
      });

      yearPanel.appendChild(yearButton);
      yearPanel.appendChild(yearContent);
      container.appendChild(yearPanel);
    });
  }

  function startTimer(timerId, seconds) {
    const element = document.getElementById(timerId);
    if (!element) return;

    clearInterval(timers[timerId]);

    let remaining = seconds;
    element.textContent = `${remaining} s`;

    timers[timerId] = setInterval(() => {
      remaining -= 1;

      if (remaining <= 0) {
        clearInterval(timers[timerId]);
        element.textContent = "Descanso finalizado!";
        return;
      }

      element.textContent = `${remaining} s`;
    }, 1000);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatWeekday(dateStr) {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString("pt-BR", { weekday: "long" });
  }

  function formatPrGain(value) {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    if (!Number.isFinite(num)) return "-";
    return num > 0 ? `+${Workouts.formatWeight(num)}` : Workouts.formatWeight(num);
  }

  return {
    render,
    renderOldWorkouts
  };
})();
