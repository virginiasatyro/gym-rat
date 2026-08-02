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
assert.strictEqual(Workouts.canEditWeights(planned[0].workouts[0]), true);

const trained = Workouts.markDayStatus(planned, 1, 'A', 'train');
assert.strictEqual(trained[0].workouts[0].status.trained, true);
assert.strictEqual(trained[0].workouts[0].status.trainedDate, plannedDate);
assert.strictEqual(trained[0].workouts[0].status.trainingCount, 1);

// Cannot train the same day twice — toggles back (untrain)
const untrained = Workouts.markDayStatus(trained, 1, 'A', 'train');
assert.strictEqual(untrained[0].workouts[0].status.trained, false);
assert.strictEqual(untrained[0].workouts[0].status.trainedDate, plannedDate);
assert.strictEqual(untrained[0].workouts[0].status.trainingCount, 0);

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
console.log('workouts-status test passed');
