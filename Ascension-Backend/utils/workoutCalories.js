export function getWorkoutMet(workoutType) {
  const token = String(workoutType || "").toLowerCase();

  if (
    token.includes("leg") ||
    token.includes("also") ||
    token.includes("lab")
  ) {
    return 6.8;
  }

  if (token.includes("full") || token.includes("teljes")) {
    return 6.3;
  }

  return 6.0;
}

export function estimateWorkoutCalories(
  workoutType,
  durationMinutes,
  bodyWeightKg,
) {
  const duration = Math.min(Math.max(Number(durationMinutes || 0), 5), 180);
  const weight = Math.min(Math.max(Number(bodyWeightKg || 70), 40), 220);
  const met = getWorkoutMet(workoutType);

  return (met * 3.5 * weight * duration) / 200;
}
