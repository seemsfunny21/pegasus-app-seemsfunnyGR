// engine.js

import { defaultState } from "./data.js";

let state = structuredClone(defaultState);
let listeners = [];

export function dispatch(event) {
  state = reducer(state, event);

  // notify UI / debug / sync layer
  listeners.forEach(fn => fn(state, event));

  return state;
}

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.push(fn);
}

function reducer(state, event) {

  switch (event.type) {

    case "CARDIO_DONE":
      state.calories.burned += event.payload.calories;
      break;

    case "DIET_LOGGED":
      state.diet.push(event.payload);
      break;

    case "EMS_SESSION":
      state.muscleGroups[event.payload.muscle] += event.payload.intensity;
      break;

    case "WORKOUT_SET_COMPLETED":
      state.muscleGroups[event.payload.muscle] += event.payload.load;
      break;
  }

  state.meta.updatedAt = Date.now();
  return state;
}
