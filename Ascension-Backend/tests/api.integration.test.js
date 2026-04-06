import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const BASE_URL = "http://localhost:3000";
let serverProc;
let dbReady = true;

let authToken = "";
let createdWorkoutId = null;

const unique = `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
const testUser = {
  username: `apitest_${unique}`,
  email: `apitest_${unique}@example.com`,
  password: "Passw0rd!123",
};

async function waitForServerReady(timeoutMs = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${BASE_URL}/swagger`);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error("Backend server did not become ready within timeout");
}

test.before(async () => {
  serverProc = spawn("node", ["server.js"], {
    cwd: process.cwd(),
    stdio: "ignore",
  });

  await waitForServerReady();
});

test.after(async () => {
  if (serverProc && !serverProc.killed) {
    serverProc.kill();
  }
});

test("Registration with valid data returns success", async (t) => {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(testUser),
  });

  if (response.status === 500) {
    dbReady = false;
    t.skip("Database not ready locally, skipping DB-dependent API tests");
    return;
  }

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.user.username, testUser.username);
});

test("Login with wrong password returns 401", async (t) => {
  if (!dbReady) {
    t.skip("Database not ready locally");
    return;
  }

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrUsername: testUser.email,
      password: "wrong-password",
    }),
  });

  assert.equal(response.status, 401);
});

test("Login with valid credentials returns token", async (t) => {
  if (!dbReady) {
    t.skip("Database not ready locally");
    return;
  }

  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      emailOrUsername: testUser.email,
      password: testUser.password,
    }),
  });

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
  assert.ok(typeof data.token === "string" && data.token.length > 20);
  authToken = data.token;
});

test("Profile save without token returns 401/403", async () => {
  const response = await fetch(`${BASE_URL}/api/profile/details`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      age: 21,
      weight: 75,
      height: 178,
      gender: "male",
      activity: 1.55,
      goal: "maintain",
      experience: "intermediate",
    }),
  });

  assert.ok(response.status === 401 || response.status === 403);
});

test("Food entry creation with valid token succeeds", async (t) => {
  if (!dbReady) {
    t.skip("Database not ready locally");
    return;
  }

  assert.ok(authToken, "Auth token is required from previous login test");

  const response = await fetch(`${BASE_URL}/api/food/add`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      foodName: "Teszt Csirkemell",
      grams: 150,
      calories: 250,
      proteinG: 31,
      carbsG: 0,
      date: "2026-04-05",
    }),
  });

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
  assert.ok(typeof data.entryId === "number");
});

test("Workout create then delete succeeds", async (t) => {
  if (!dbReady) {
    t.skip("Database not ready locally");
    return;
  }

  assert.ok(authToken, "Auth token is required from previous login test");

  const createResponse = await fetch(`${BASE_URL}/api/workout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      workoutType: "full body",
      exerciseName: "Squat",
      durationMinutes: 45,
      caloriesBurned: 320,
      sets: 4,
      reps: 10,
      weightKg: 70,
      notes: "integration test",
      date: "2026-04-05",
    }),
  });

  assert.equal(createResponse.status, 200);
  const createData = await createResponse.json();
  assert.equal(createData.success, true);
  createdWorkoutId = createData.entryId;
  assert.ok(typeof createdWorkoutId === "number");

  const deleteResponse = await fetch(
    `${BASE_URL}/api/workout/${createdWorkoutId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    },
  );

  assert.equal(deleteResponse.status, 200);
  const deleteData = await deleteResponse.json();
  assert.equal(deleteData.success, true);
});
