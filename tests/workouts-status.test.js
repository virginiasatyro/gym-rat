const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const source = fs.readFileSync('js/workouts.js', 'utf8');
const transformed = source.replace('const Workouts = (() => {', 'globalThis.__Workouts = (() => {');
const context = {
  window: { EXERCISE_CATALOG_BY_NAME: {} },
  console,
  Date
};

vm.createContext(context);
vm.runInContext(transformed, context);

const Workouts = context.__Workouts;
const workouts = [{
  id: 1,
  active: true,
  workouts: [{
    id: 'A',
    name: 'Treino A',
    exercises: []
  }]
}];

assert.strictEqual(Workouts.canEditWeights(workouts[0].workouts[0]), false);

const planned = Workouts.markDayStatus(workouts, 1, 'A', 'plan');
const plannedDate = new Date().toISOString().slice(0, 10);
assert.strictEqual(planned[0].workouts[0].status.planned, true);
assert.strictEqual(planned[0].workouts[0].status.plannedDate, plannedDate);
assert.strictEqual(Workouts.canEditWeights(planned[0].workouts[0]), false);

const trained = Workouts.markDayStatus(planned, 1, 'A', 'train');
assert.strictEqual(trained[0].workouts[0].status.trained, true);
assert.strictEqual(trained[0].workouts[0].status.trainedDate, plannedDate);
assert.strictEqual(trained[0].workouts[0].status.trainingCount, 1);
assert.strictEqual(Workouts.canEditWeights(trained[0].workouts[0]), true);

// Cannot train the same day twice — toggles back (untrain)
const untrained = Workouts.markDayStatus(trained, 1, 'A', 'train');
assert.strictEqual(untrained[0].workouts[0].status.trained, false);
assert.strictEqual(untrained[0].workouts[0].status.trainedDate, plannedDate);
assert.strictEqual(untrained[0].workouts[0].status.trainingCount, 0);
assert.strictEqual(Workouts.canEditWeights(untrained[0].workouts[0]), false);

// Training again on same day re-marks it
const retrained = Workouts.markDayStatus(untrained, 1, 'A', 'train');
assert.strictEqual(retrained[0].workouts[0].status.trained, true);
assert.strictEqual(retrained[0].workouts[0].status.trainedDate, plannedDate);
assert.strictEqual(retrained[0].workouts[0].status.trainingCount, 1);

// Cannot train a different workout with the same dayId if already trained today
const otherWorkout = [
  ...retrained,
  {
    id: 3,
    active: true,
    workouts: [{
      id: 'A',
      name: 'Treino A (old)',
      exercises: []
    }]
  }
];

const blocked = Workouts.markDayStatus(otherWorkout, 3, 'A', 'train');
assert.strictEqual(blocked[1].workouts[0].status.trained, false);
assert.strictEqual(blocked[1].workouts[0].status.trainedDate || null, null);

const groupedOldWorkouts = Workouts.getOldByYear([
  ...trained,
  {
    id: 2,
    active: false,
    year: 2025,
    name: 'Treino Teste',
    workouts: []
  }
]);

assert.deepStrictEqual(groupedOldWorkouts.map((group) => group.year), [2026, 2025, 2024, 2023]);
assert.strictEqual(groupedOldWorkouts.find((group) => group.year === 2025).workouts.length, 1);

// PR remains absolute max value
const exerciseWithHistory = {
  id: 1,
  name: 'Supino',
  reps: '8-10',
  exerciseId: 'bench-press',
  history: [
    { date: '2025-01-10', weight: 40 },
    { date: '2025-06-15', weight: 55 },
    { date: '2025-12-20', weight: 60 }
  ]
};

const categories = Workouts.getPrCategories(exerciseWithHistory);
assert.strictEqual(categories.medium, 60); // absolute PR

// Evolution compares first vs current weight
assert.strictEqual(Workouts.getEvolution(exerciseWithHistory), 20); // 60 - 40

const exerciseNoHistory = { id: 2, name: 'Novo', reps: '12' };
assert.strictEqual(Workouts.getEvolution(exerciseNoHistory), null);

const exerciseOneEntry = { id: 3, name: 'Unico', reps: '10', history: [{ date: '2025-01-01', weight: 30 }] };
assert.strictEqual(Workouts.getEvolution(exerciseOneEntry), null);

// Auto-fill weights when marking as trained
const autoFillWorkouts = [{
  id: 10,
  active: true,
  workouts: [{
    id: 'B',
    name: 'Treino B',
    exercises: [{
      id: 1,
      name: 'Supino',
      reps: '8-10',
      exerciseId: 'bench-press',
      lastWeight: 70,
      history: [{ date: '2025-06-01', weight: 60 }]
    }, {
      id: 2,
      name: 'Agachamento',
      reps: '5-8',
      exerciseId: 'squat',
      lastWeight: 100,
      history: [{ date: '2025-06-01', weight: 90 }]
    }]
  }]
}];

const autoFilled = Workouts.markDayStatus(autoFillWorkouts, 10, 'B', 'train');
const today = new Date().toISOString().slice(0, 10);

// Supino: last weight 70 should be copied as new history entry
assert.strictEqual(autoFilled[0].workouts[0].exercises[0].history.length, 2);
assert.strictEqual(autoFilled[0].workouts[0].exercises[0].history[1].weight, 70);
assert.strictEqual(autoFilled[0].workouts[0].exercises[0].history[1].date, today);

// Agachamento: last weight 100 should be copied
assert.strictEqual(autoFilled[0].workouts[0].exercises[1].history.length, 2);
assert.strictEqual(autoFilled[0].workouts[0].exercises[1].history[1].weight, 100);
assert.strictEqual(autoFilled[0].workouts[0].exercises[1].history[1].date, today);

console.log('workouts-status test passed');
