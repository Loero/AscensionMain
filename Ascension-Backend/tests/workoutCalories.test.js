import test from "node:test";
import assert from "node:assert/strict";
import {
  estimateWorkoutCalories,
  getWorkoutMet,
} from "../utils/workoutCalories.js";

test("getWorkoutMet returns leg workout MET", () => {
  assert.equal(getWorkoutMet("leg day"), 6.8);
  assert.equal(getWorkoutMet("also test"), 6.8);
});

test("getWorkoutMet returns full body MET", () => {
  assert.equal(getWorkoutMet("full body"), 6.3);
  assert.equal(getWorkoutMet("teljes test"), 6.3);
});

test("estimateWorkoutCalories returns expected deterministic value", () => {
  const result = estimateWorkoutCalories("full body", 60, 80);
  const expected = (6.3 * 3.5 * 80 * 60) / 200;

  assert.ok(Math.abs(result - expected) < 0.000001);
});

test("estimateWorkoutCalories clamps invalid input to safe range", () => {
  // duration clamped to 5, falsy weight defaults to 70
  const clampedLow = estimateWorkoutCalories("random", 0, 0);
  const expectedLow = (6.0 * 3.5 * 70 * 5) / 200;
  assert.ok(Math.abs(clampedLow - expectedLow) < 0.000001);

  // duration clamped to 180, weight clamped to 220
  const clampedHigh = estimateWorkoutCalories("random", 999, 999);
  const expectedHigh = (6.0 * 3.5 * 220 * 180) / 200;
  assert.ok(Math.abs(clampedHigh - expectedHigh) < 0.000001);
});
