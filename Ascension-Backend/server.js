import express from "express";
import cors from "cors";
import multer from "multer";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Sequelize, DataTypes, Op, fn, col, QueryTypes } from "sequelize";

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5501",
      "http://localhost:5173",
      "http://127.0.0.1:5501",
      "http://localhost:5500",
      "http://127.0.0.1:5500",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
const upload = multer({ dest: "uploads/" });

const sequelize = new Sequelize("ascension_db", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
});

try {
  await sequelize.authenticate();
  console.log("✅ Sequelize kapcsolódva");
} catch (err) {
  console.error("❌ Sequelize hiba:", err);
}

const User = sequelize.define(
  "User",
  {
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password_hash: DataTypes.STRING,
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

const UserProfile = sequelize.define(
  "UserProfile",
  {
    age: DataTypes.INTEGER,
    weight_kg: DataTypes.FLOAT,
    height_cm: DataTypes.INTEGER,
    gender: DataTypes.STRING,
    activity_multiplier: DataTypes.FLOAT,
    goal: DataTypes.STRING,
    experience: DataTypes.STRING,
  },
  { tableName: "user_profile", timestamps: false },
);

const FoodEntry = sequelize.define(
  "FoodEntry",
  {
    food_name: DataTypes.STRING,
    grams: DataTypes.FLOAT,
    calories: DataTypes.FLOAT,
    protein_g: DataTypes.FLOAT,
    carbs_g: DataTypes.FLOAT,
    date: DataTypes.DATEONLY,
  },
  {
    tableName: "food_entries",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

const WorkoutEntry = sequelize.define(
  "WorkoutEntry",
  {
    workout_type: DataTypes.STRING,
    exercise_name: DataTypes.STRING,
    duration_minutes: DataTypes.INTEGER,
    calories_burned: DataTypes.FLOAT,
    sets: DataTypes.INTEGER,
    reps: DataTypes.INTEGER,
    weight_kg: DataTypes.FLOAT,
    notes: DataTypes.TEXT,
    date: DataTypes.DATEONLY,
  },
  {
    tableName: "workout_entries",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

const SkinRoutine = sequelize.define(
  "SkinRoutine",
  {
    skin_type: DataTypes.STRING,
    age_group: DataTypes.STRING,
    concerns: DataTypes.TEXT,
    goals: DataTypes.TEXT,
    morning_routine: DataTypes.TEXT,
    evening_routine: DataTypes.TEXT,
    weekly_treatments: DataTypes.TEXT,
    product_recommendations: DataTypes.TEXT,
    tips: DataTypes.TEXT,
    is_active: DataTypes.BOOLEAN,
  },
  { tableName: "skin_routines", timestamps: true },
);

const SkinRoutineTracking = sequelize.define(
  "SkinRoutineTracking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    routine_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },

    morning_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    evening_completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    morning_steps: {
      type: DataTypes.TEXT,
    },

    evening_steps: {
      type: DataTypes.TEXT,
    },

    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "skin_routine_tracking",
    timestamps: true,
  },
);

User.hasOne(UserProfile, { foreignKey: "user_id" });
User.hasMany(FoodEntry, { foreignKey: "user_id" });
User.hasMany(WorkoutEntry, { foreignKey: "user_id" });
User.hasMany(SkinRoutine, { foreignKey: "user_id" });

SkinRoutine.hasMany(SkinRoutineTracking, {
  foreignKey: "routine_id",
});

SkinRoutineTracking.belongsTo(SkinRoutine, {
  foreignKey: "routine_id",
});

const JWT_SECRET = "ascension_secret_2026";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || `${JWT_SECRET}_admin`;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/* ====== AUTH MIDDLEWARE ====== */
function authenticateToken(req, res, next) {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Nincs megadva hitelesítési token. Jelentkezz be újra.",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.error("❌ JWT verify hiba:", err.message);
      return res.status(403).json({
        success: false,
        error: "Érvénytelen vagy lejárt token. Jelentkezz be újra.",
      });
    }

    // req.user-be rakjuk a fontos adatokat
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      email: decoded.email,
    };

    next();
  });
}

function authenticateAdminToken(req, res, next) {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Hianyzo admin token.",
    });
  }

  jwt.verify(token, ADMIN_JWT_SECRET, (err, decoded) => {
    if (err || decoded?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Ervenytelen admin token.",
      });
    }

    req.admin = decoded;
    next();
  });
}

/* ====== CLOUDINARY ====== */
cloudinary.config({
  cloud_name: "dpgrckgpd",
  api_key: "971153315419944",
  api_secret: "8Il9Me1gW-ZOK-hkwjazlT_rMYM",
});

/* ====== USDA FoodData Central ====== */
const FDC_API_KEY =
  process.env.FDC_API_KEY || "dVZB801iAYTee9gse3M24mw2rYVtxkjpd2kW3jT3";

/* ====== SEGÉD ====== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getWorkoutMet(workoutType) {
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

function estimateWorkoutCalories(workoutType, durationMinutes, bodyWeightKg) {
  const duration = Math.min(Math.max(Number(durationMinutes || 0), 5), 180);
  const weight = Math.min(Math.max(Number(bodyWeightKg || 70), 40), 220);
  const met = getWorkoutMet(workoutType);

  return (met * 3.5 * weight * duration) / 200;
}

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Bejelentkezés
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [emailOrUsername, password]
 *             properties:
 *               emailOrUsername:
 *                 type: string
 *                 example: tesztuser
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: JWT token visszaadása
 */
app.post("/api/auth/login", async (req, res) => {
  const { emailOrUsername, password } = req.body;

  const user = await User.findOne({
    where: {
      [Op.or]: [{ email: emailOrUsername }, { username: emailOrUsername }],
    },
  });

  if (!user) return res.status(401).json({ error: "Hibás adatok" });

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) return res.status(401).json({ error: "Hibás adatok" });

  const token = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.json({
    success: true,
    token,
  });
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Felhasználó regisztráció
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: tesztuser
 *               email:
 *                 type: string
 *                 example: teszt@mail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Sikeres regisztráció
 */
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  const exists = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }],
    },
  });

  if (exists) return res.status(409).json({ error: "User létezik" });

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password_hash: hash,
  });

  res.json({
    success: true,
    user,
  });
});

/* ====== PROFILE ENDPOINT ====== */

// Profil adatok lekérése (felhasználó + statisztikák + személyes adatok)
/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Profil statisztikák lekérése
 *     description: Heti, havi és összesített food és workout statisztikák + legutóbbi bejegyzések
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil statisztikák
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 food:
 *                   type: object
 *                   properties:
 *
 *                     week:
 *                       type: object
 *                       properties:
 *                         entries:
 *                           type: integer
 *                           example: 5
 *                         total_calories:
 *                           type: number
 *                           example: 2200
 *                         total_protein:
 *                           type: number
 *                           example: 180
 *                         total_carbs:
 *                           type: number
 *                           example: 250
 *
 *                     month:
 *                       type: object
 *                       properties:
 *                         entries:
 *                           type: integer
 *                         total_calories:
 *                           type: number
 *                         total_protein:
 *                           type: number
 *                         total_carbs:
 *                           type: number
 *
 *                     total:
 *                       type: object
 *                       properties:
 *                         entries:
 *                           type: integer
 *                         total_calories:
 *                           type: number
 *                         total_protein:
 *                           type: number
 *                         total_carbs:
 *                           type: number
 *
 *                     recent:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           food_name:
 *                             type: string
 *                             example: chicken breast
 *                           grams:
 *                             type: number
 *                             example: 200
 *                           calories:
 *                             type: number
 *                             example: 330
 *                           protein_g:
 *                             type: number
 *                             example: 60
 *                           carbs_g:
 *                             type: number
 *                             example: 0
 *                           date:
 *                             type: string
 *                             format: date
 *                           created_at:
 *                             type: string
 *                             example: 2026-03-29T10:00:00.000Z
 *
 *                 workout:
 *                   type: object
 *                   properties:
 *
 *                     week:
 *                       type: object
 *                       properties:
 *                         entries:
 *                           type: integer
 *                         total_duration:
 *                           type: number
 *                           example: 180
 *                         total_calories:
 *                           type: number
 *                           example: 900
 *                         total_sets:
 *                           type: number
 *                           example: 25
 *
 *                     month:
 *                       type: object
 *                       properties:
 *                         entries:
 *                           type: integer
 *                         total_duration:
 *                           type: number
 *                         total_calories:
 *                           type: number
 *                         total_sets:
 *                           type: number
 *
 *                     total:
 *                       type: object
 *                       properties:
 *                         entries:
 *                           type: integer
 *                         total_duration:
 *                           type: number
 *                         total_calories:
 *                           type: number
 *                         total_sets:
 *                           type: number
 *
 *                     recent:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           workout_type:
 *                             type: string
 *                             example: strength
 *                           exercise_name:
 *                             type: string
 *                             example: Bench Press
 *                           duration_minutes:
 *                             type: number
 *                             example: 45
 *                           calories_burned:
 *                             type: number
 *                             example: 320
 *                           sets:
 *                             type: integer
 *                             example: 4
 *                           reps:
 *                             type: integer
 *                             example: 10
 *                           weight_kg:
 *                             type: number
 *                             example: 70
 *                           notes:
 *                             type: string
 *                             example: jó edzés volt
 *                           date:
 *                             type: string
 *                             format: date
 *                           created_at:
 *                             type: string
 *                             example: 2026-03-29T10:00:00.000Z
 *
 *       401:
 *         description: Nincs token
 *
 *       500:
 *         description: Szerver hiba
 */
app.get("/api/profile", authenticateToken, async (req, res) => {
  // (Alkohol statisztikák eltávolítva)

  try {
    const userId = req.user.userId;

    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    /* ======================
       FOOD STATS
    ======================*/

    const foodWeekStats = await FoodEntry.findOne({
      attributes: [
        [fn("COUNT", col("id")), "entries"],
        [fn("SUM", col("calories")), "total_calories"],
        [fn("SUM", col("protein_g")), "total_protein"],
        [fn("SUM", col("carbs_g")), "total_carbs"],
      ],
      where: {
        user_id: userId,
        date: {
          [Op.gte]: startOfWeek,
        },
      },
    });

    const foodMonthStats = await FoodEntry.findOne({
      attributes: [
        [fn("COUNT", col("id")), "entries"],
        [fn("SUM", col("calories")), "total_calories"],
        [fn("SUM", col("protein_g")), "total_protein"],
        [fn("SUM", col("carbs_g")), "total_carbs"],
      ],
      where: {
        user_id: userId,
        date: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    const foodTotalStats = await FoodEntry.findOne({
      attributes: [
        [fn("COUNT", col("id")), "entries"],
        [fn("SUM", col("calories")), "total_calories"],
        [fn("SUM", col("protein_g")), "total_protein"],
        [fn("SUM", col("carbs_g")), "total_carbs"],
      ],
      where: {
        user_id: userId,
      },
    });

    const recentFoodEntries = await FoodEntry.findAll({
      where: { user_id: userId },

      order: [
        ["date", "DESC"],
        ["created_at", "DESC"],
      ],

      limit: 5,
    });

    /* ======================
       WORKOUT STATS
    ======================*/

    const workoutWeekStats = await WorkoutEntry.findOne({
      attributes: [
        [fn("COUNT", col("id")), "entries"],

        [fn("SUM", col("duration_minutes")), "total_duration"],

        [fn("SUM", col("calories_burned")), "total_calories"],

        [fn("SUM", col("sets")), "total_sets"],
      ],

      where: {
        user_id: userId,

        date: {
          [Op.gte]: startOfWeek,
        },
      },
    });

    const workoutMonthStats = await WorkoutEntry.findOne({
      attributes: [
        [fn("COUNT", col("id")), "entries"],

        [fn("SUM", col("duration_minutes")), "total_duration"],

        [fn("SUM", col("calories_burned")), "total_calories"],

        [fn("SUM", col("sets")), "total_sets"],
      ],

      where: {
        user_id: userId,

        date: {
          [Op.gte]: startOfMonth,
        },
      },
    });

    const workoutTotalStats = await WorkoutEntry.findOne({
      attributes: [
        [fn("COUNT", col("id")), "entries"],

        [fn("SUM", col("duration_minutes")), "total_duration"],

        [fn("SUM", col("calories_burned")), "total_calories"],

        [fn("SUM", col("sets")), "total_sets"],
      ],

      where: {
        user_id: userId,
      },
    });

    const recentWorkoutEntries = await WorkoutEntry.findAll({
      where: { user_id: userId },

      order: [
        ["date", "DESC"],

        ["created_at", "DESC"],
      ],

      limit: 5,
    });

    console.log("profil stat kész");

    res.json({
      success: true,

      food: {
        week: foodWeekStats,

        month: foodMonthStats,

        total: foodTotalStats,

        recent: recentFoodEntries,
      },

      workout: {
        week: workoutWeekStats,

        month: workoutMonthStats,

        total: workoutTotalStats,

        recent: recentWorkoutEntries,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "profil stat hiba",
    });
  }
});

// Személyes adatok mentése a felhasználó profiljához (életkor, súly, magasság stb.)
/**
 * @swagger
 * /api/profile/details:
 *   post:
 *     summary: Profil adatok mentése
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               age:
 *                 type: integer
 *                 example: 28
 *               weight:
 *                 type: number
 *                 example: 80
 *               height:
 *                 type: integer
 *                 example: 180
 *               gender:
 *                 type: string
 *                 example: male
 *               activity:
 *                 type: number
 *                 example: 1.55
 *               goal:
 *                 type: string
 *                 example: muscle_gain
 *               experience:
 *                 type: string
 *                 example: beginner
 */
app.post("/api/profile/details", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { age, weight, height, gender, activity, goal, experience } =
      req.body;

    /* konverziók */

    const ageInt =
      age !== undefined && age !== null && age !== ""
        ? parseInt(age, 10)
        : null;

    const weightKg =
      weight !== undefined && weight !== null && weight !== ""
        ? parseFloat(weight)
        : null;

    const heightCm =
      height !== undefined && height !== null && height !== ""
        ? parseInt(height, 10)
        : null;

    const activityMultiplier =
      activity !== undefined && activity !== null && activity !== ""
        ? parseFloat(activity)
        : null;

    /* ORM UPSERT */

    await UserProfile.upsert({
      user_id: userId,

      age: ageInt,

      weight_kg: weightKg,

      height_cm: heightCm,

      gender: gender || null,

      activity_multiplier: activityMultiplier,

      goal: goal || null,

      experience: experience || null,
    });

    console.log("profil mentve", userId);

    res.json({
      success: true,

      message: "Profil adatok mentve",
    });
  } catch (error) {
    console.error("profile save error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

// DELETE /api/profile/details - Profil adatok törlése
/**
 * @swagger
 * /api/profile/details:
 *   delete:
 *     summary: Profil adatok törlése
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 */
app.delete("/api/profile/details", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const deletedCount = await UserProfile.destroy({
      where: {
        user_id: userId,
      },
    });

    console.log("profil törölve", userId);

    res.json({
      success: true,

      deletedRows: deletedCount,

      message: "Profil adatok törölve",
    });
  } catch (error) {
    console.error("profile delete error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});
/* ====== FOOD TRACKING ENDPOINTS ====== */

// Étel bejegyzés hozzáadása

/**
 * @swagger
 * /api/food/add:
 *   post:
 *     summary: Étel bejegyzés hozzáadása
 *     description: Új étel rögzítése kalória és makró adatokkal
 *     tags:
 *       - Food
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - foodName
 *               - grams
 *               - calories
 *               - proteinG
 *               - carbsG
 *               - date
 *
 *             properties:
 *
 *               foodName:
 *                 type: string
 *                 example: csirkemell
 *
 *               grams:
 *                 type: number
 *                 example: 150
 *
 *               calories:
 *                 type: number
 *                 example: 165
 *
 *               proteinG:
 *                 type: number
 *                 example: 31
 *
 *               carbsG:
 *                 type: number
 *                 example: 0
 *
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-29
 *
 *     responses:
 *
 *       200:
 *         description: Étel sikeresen mentve
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Étel mentve
 *
 *                 entryId:
 *                   type: integer
 *                   example: 12
 *
 *       400:
 *         description: Hiányzó kötelező mező
 *
 *       401:
 *         description: Nincs érvényes token
 *
 *       500:
 *         description: Szerver hiba
 */
app.post("/api/food/add", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { foodName, grams, calories, proteinG, carbsG, date } = req.body;

    /* validáció */

    if (
      !foodName ||
      !grams ||
      calories === undefined ||
      proteinG === undefined ||
      carbsG === undefined ||
      !date
    ) {
      return res.status(400).json({
        success: false,

        error: "Minden mező kötelező",
      });
    }

    /* ORM insert */

    const entry = await FoodEntry.create({
      user_id: userId,

      food_name: foodName,

      grams: grams,

      calories: calories,

      protein_g: proteinG,

      carbs_g: carbsG,

      date: date,
    });

    console.log("food mentve", entry.id);

    res.json({
      success: true,

      message: "Étel mentve",

      entryId: entry.id,
    });
  } catch (error) {
    console.error("food create error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

/* ====== WORKOUT TRACKING ENDPOINTS ====== */

// POST /api/workout - Új edzés hozzáadása
/**
 * @swagger
 * /api/workout:
 *   post:
 *     summary: Edzés mentése
 *     tags: [Workout]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workoutType
 *               - exerciseName
 *               - durationMinutes
 *               - caloriesBurned
 *               - date
 *             properties:
 *               workoutType:
 *                 type: string
 *                 example: strength
 *               exerciseName:
 *                 type: string
 *                 example: Bench Press
 *               durationMinutes:
 *                 type: integer
 *                 example: 45
 *               caloriesBurned:
 *                 type: number
 *                 example: 320
 *               sets:
 *                 type: integer
 *                 example: 4
 *               reps:
 *                 type: integer
 *                 example: 10
 *               weightKg:
 *                 type: number
 *                 example: 60
 *               notes:
 *                 type: string
 *                 example: jó edzés volt
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-29
 *     responses:
 *       200:
 *         description: Sikeres mentés
 */
app.post("/api/workout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      workoutType,
      exerciseName,
      durationMinutes,
      caloriesBurned,
      sets,
      reps,
      weightKg,
      notes,
      date,
    } = req.body;

    /* validáció */

    if (!workoutType || !exerciseName || !durationMinutes || !date) {
      return res.status(400).json({
        success: false,

        error: "Hiányzó kötelező mező",
      });
    }

    const durationMinutesNum = Number(durationMinutes);
    if (
      !Number.isFinite(durationMinutesNum) ||
      durationMinutesNum <= 0 ||
      durationMinutesNum > 300
    ) {
      return res.status(400).json({
        success: false,
        error: "Ervénytelen edzésidő.",
      });
    }

    const profile = await UserProfile.findOne({
      where: { user_id: userId },
      attributes: ["weight_kg"],
    });

    const weightForCalc = Number(profile?.weight_kg || weightKg || 70);
    const estimatedCalories = estimateWorkoutCalories(
      workoutType,
      durationMinutesNum,
      weightForCalc,
    );

    let caloriesBurnedNum = Number(caloriesBurned);
    if (!Number.isFinite(caloriesBurnedNum) || caloriesBurnedNum <= 0) {
      caloriesBurnedNum = estimatedCalories;
    }

    const minReasonableCalories = durationMinutesNum * 2;
    const maxReasonableCalories = durationMinutesNum * 18;
    if (
      caloriesBurnedNum < minReasonableCalories ||
      caloriesBurnedNum > maxReasonableCalories
    ) {
      caloriesBurnedNum = estimatedCalories;
    }

    const safeCaloriesBurned = Math.round(caloriesBurnedNum * 10) / 10;

    /* ORM insert */

    const workout = await WorkoutEntry.create({
      user_id: userId,

      workout_type: workoutType,

      exercise_name: exerciseName,

      duration_minutes: Math.round(durationMinutesNum),

      calories_burned: safeCaloriesBurned,

      sets: sets || null,

      reps: reps || null,

      weight_kg: weightKg || null,

      notes: notes || null,

      date: date,
    });

    console.log("workout mentve", workout.id);

    res.json({
      success: true,

      message: "Edzés mentve",

      entryId: workout.id,
    });
  } catch (error) {
    console.error("workout create error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

// GET /api/workout - Edzés bejegyzések lekérése
/**
 * @swagger
 * /api/workout:
 *   get:
 *     summary: Edzés lista lekérése
 *     description: Lekéri a felhasználó edzéseit opcionális dátum szűréssel
 *     tags: [Workout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         example: 2026-03-01
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         example: 2026-03-31
 *     responses:
 *       200:
 *         description: Edzés lista
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 entries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       workoutType:
 *                         type: string
 *                         example: strength
 *                       exerciseName:
 *                         type: string
 *                         example: Bench Press
 *                       durationMinutes:
 *                         type: integer
 *                         example: 45
 *                       caloriesBurned:
 *                         type: number
 *                         example: 320
 *                       sets:
 *                         type: integer
 *                         example: 4
 *                       reps:
 *                         type: integer
 *                         example: 10
 *                       weightKg:
 *                         type: number
 *                         example: 70
 *                       notes:
 *                         type: string
 *                         example: jó edzés volt
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: 2026-03-29
 *                       createdAt:
 *                         type: string
 *                         example: 2026-03-29T10:00:00.000Z
 */

app.get("/api/workout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { startDate, endDate } = req.query;

    /* WHERE feltétel */

    const whereClause = {
      user_id: userId,
    };

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    /* ORM SELECT */

    const entries = await WorkoutEntry.findAll({
      where: whereClause,

      order: [
        ["date", "DESC"],

        ["created_at", "DESC"],
      ],
    });

    console.log("workout lista", entries.length);

    res.json({
      success: true,

      entries: entries.map((entry) => ({
        id: entry.id,

        workoutType: entry.workout_type,

        exerciseName: entry.exercise_name,

        durationMinutes: entry.duration_minutes,

        caloriesBurned: entry.calories_burned,

        sets: entry.sets,

        reps: entry.reps,

        weightKg: entry.weight_kg ? Number(entry.weight_kg).toFixed(1) : null,

        notes: entry.notes,

        date: entry.date,

        createdAt: entry.created_at,
      })),
    });
  } catch (error) {
    console.error("workout list error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});
// DELETE /api/workout - Összes edzés bejegyzés törlése (teszteléshez)
/**
 * @swagger
 * /api/workout:
 *   delete:
 *     summary: Összes edzés törlése
 *     tags: [Workout]
 */
app.delete("/api/workout", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    console.log("összes workout törlés", userId);

    /* ORM bulk delete */

    const deletedCount = await WorkoutEntry.destroy({
      where: {
        user_id: userId,
      },
    });

    res.json({
      success: true,

      message: "Edzések törölve",

      deletedCount,
    });
  } catch (error) {
    console.error("workout bulk delete error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

// DELETE /api/workout/:id - Edzés bejegyzés törlése
/**
 * @swagger
 * /api/workout/{id}:
 *   delete:
 *     summary: Edzés törlése ID alapján
 *     tags: [Workout]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 */
app.delete("/api/workout/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const entryId = req.params.id;

    console.log("workout törlés", { userId, entryId });

    /* ORM delete */

    const deletedCount = await WorkoutEntry.destroy({
      where: {
        id: entryId,

        user_id: userId,
      },
    });

    /* ha nincs ilyen rekord */

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,

        error: "Nem található ilyen edzés",
      });
    }

    console.log("workout törölve", entryId);

    res.json({
      success: true,

      message: "Edzés törölve",
    });
  } catch (error) {
    console.error("workout delete error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

// Étel bejegyzések lekérése (adott dátum vagy időszak)
/**
 * @swagger
 * /api/food/entries:
 *   get:
 *     summary: Étel bejegyzések lekérése
 *     description: A felhasználó étel napló bejegyzéseinek listája, opcionális dátum szűréssel
 *     tags:
 *       - Food
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Egy adott nap bejegyzései
 *         example: 2026-03-29
 *
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Intervallum kezdete
 *         example: 2026-03-01
 *
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Intervallum vége
 *         example: 2026-03-31
 *
 *     responses:
 *
 *       200:
 *         description: Lista sikeresen lekérve
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 entries:
 *                   type: array
 *
 *                   items:
 *                     type: object
 *
 *                     properties:
 *
 *                       id:
 *                         type: integer
 *                         example: 12
 *
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *
 *                       food_name:
 *                         type: string
 *                         example: csirkemell
 *
 *                       grams:
 *                         type: number
 *                         example: 150
 *
 *                       calories:
 *                         type: number
 *                         example: 165
 *
 *                       protein_g:
 *                         type: number
 *                         example: 31
 *
 *                       carbs_g:
 *                         type: number
 *                         example: 0
 *
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: 2026-03-29
 *
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *
 *       401:
 *         description: nincs token
 *
 *       500:
 *         description: szerver hiba
 */

app.get("/api/food/entries", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { date, startDate, endDate } = req.query;

    /* WHERE feltétel */

    const whereClause = {
      user_id: userId,
    };

    if (date) {
      whereClause.date = date;
    } else if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate],
      };
    }

    /* ORM SELECT */

    const entries = await FoodEntry.findAll({
      where: whereClause,

      order: [
        ["date", "DESC"],

        ["created_at", "DESC"],
      ],
    });

    res.json({
      success: true,

      entries,
    });
  } catch (error) {
    console.error("food list error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

// Étel bejegyzés törlése
/**
 * @swagger
 * /api/food/{id}:
 *   delete:
 *     summary: Étel bejegyzés törlése
 *     description: A felhasználó saját étel bejegyzésének törlése ID alapján
 *     tags:
 *       - Food
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: path
 *         name: id
 *         required: true
 *
 *         schema:
 *           type: integer
 *
 *         description: törlendő étel bejegyzés ID
 *
 *         example: 15
 *
 *     responses:
 *
 *       200:
 *         description: sikeres törlés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 message:
 *                   type: string
 *                   example: Étel bejegyzés törölve
 *
 *       404:
 *         description: nincs ilyen bejegyzés
 *
 *       401:
 *         description: nincs token
 *
 *       500:
 *         description: szerver hiba
 */
app.delete("/api/food/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const entryId = req.params.id;

    const deletedCount = await FoodEntry.destroy({
      where: {
        id: entryId,

        user_id: userId,
      },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,

        error: "Bejegyzés nem található",
      });
    }

    console.log("food törölve", entryId);

    res.json({
      success: true,

      message: "Étel bejegyzés törölve",
    });
  } catch (error) {
    console.error("food delete error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

/* ====== SKIN ROUTINE ENDPOINTS ====== */

// Rutin mentése
/**
 * @swagger
 * /api/skin/save-routine:
 *   post:
 *     summary: Skin routine mentése vagy frissítése
 *     description: A felhasználó bőrápolási rutinját menti vagy frissíti. Ha nincs változás, unchanged=true értéket ad vissza.
 *     tags: [Skin]
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             properties:
 *
 *               answers:
 *                 type: object
 *                 description: kérdőív válaszok
 *
 *                 properties:
 *
 *                   skin_type:
 *                     type: string
 *                     example: oily
 *
 *                   age:
 *                     type: string
 *                     example: 25_35
 *
 *                   concerns:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - acne
 *                       - redness
 *
 *                   goals:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - hydration
 *                       - anti-aging
 *
 *
 *               routine:
 *                 type: object
 *                 description: generált rutin
 *
 *                 properties:
 *
 *                   skin_type:
 *                     type: string
 *                     example: oily
 *
 *                   age_group:
 *                     type: string
 *                     example: 25_35
 *
 *                   concerns:
 *                     type: array
 *                     items:
 *                       type: string
 *
 *                   goals:
 *                     type: array
 *                     items:
 *                       type: string
 *
 *                   morning_routine:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - cleanser
 *                       - moisturizer
 *                       - sunscreen
 *
 *                   evening_routine:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - cleanser
 *                       - serum
 *                       - night cream
 *
 *                   weekly_treatments:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - exfoliation
 *                       - face mask
 *
 *                   product_recommendations:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - CeraVe cleanser
 *                       - The Ordinary Niacinamide
 *
 *                   tips:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example:
 *                       - igyál több vizet
 *                       - használj fényvédőt
 *
 *
 *     responses:
 *
 *       200:
 *         description: sikeres mentés
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 inserted:
 *                   type: boolean
 *                   example: true
 *                   description: új rekord jött létre
 *
 *                 updated:
 *                   type: boolean
 *                   example: true
 *                   description: meglévő rekord frissítve
 *
 *                 unchanged:
 *                   type: boolean
 *                   example: true
 *                   description: nem történt módosítás
 *
 *                 routine_id:
 *                   type: integer
 *                   example: 12
 *
 *
 *       401:
 *         description: nincs token
 *
 *       500:
 *         description: szerver hiba
 */
app.post("/api/skin/save-routine", authenticateToken, async (req, res) => {
  try {
    const { answers, routine } = req.body;

    const userId = req.user.userId;

    const normalizeArray = (value) => (Array.isArray(value) ? value : []);

    const normalizeJsonString = (value) => {
      try {
        return JSON.stringify(JSON.parse(value || "[]"));
      } catch {
        return JSON.stringify([]);
      }
    };

    const payload = {
      skin_type: answers?.skin_type || routine?.skin_type || "normal",

      age_group: answers?.age || routine?.age_group || "25_35",

      concerns: JSON.stringify(
        normalizeArray(answers?.concerns || routine?.concerns),
      ),

      goals: JSON.stringify(normalizeArray(answers?.goals || routine?.goals)),

      morning_routine: JSON.stringify(normalizeArray(routine?.morning_routine)),

      evening_routine: JSON.stringify(normalizeArray(routine?.evening_routine)),

      weekly_treatments: JSON.stringify(
        normalizeArray(routine?.weekly_treatments),
      ),

      product_recommendations: JSON.stringify(
        normalizeArray(routine?.product_recommendations),
      ),

      tips: JSON.stringify(normalizeArray(routine?.tips)),
    };

    /* aktív rutin keresése */

    const existing = await SkinRoutine.findOne({
      where: {
        user_id: userId,

        is_active: true,
      },

      order: [
        ["updatedAt", "DESC"],

        ["createdAt", "DESC"],
      ],
    });

    /* ha van már rutin */

    if (existing) {
      const hasNoChanges =
        String(existing.skin_type || "") === String(payload.skin_type) &&
        String(existing.age_group || "") === String(payload.age_group) &&
        normalizeJsonString(existing.concerns) === payload.concerns &&
        normalizeJsonString(existing.goals) === payload.goals &&
        normalizeJsonString(existing.morning_routine) ===
          payload.morning_routine &&
        normalizeJsonString(existing.evening_routine) ===
          payload.evening_routine &&
        normalizeJsonString(existing.weekly_treatments) ===
          payload.weekly_treatments &&
        normalizeJsonString(existing.product_recommendations) ===
          payload.product_recommendations &&
        normalizeJsonString(existing.tips) === payload.tips;

      if (hasNoChanges) {
        return res.json({
          success: true,

          unchanged: true,

          routine_id: existing.id,
        });
      }

      /* update */

      await existing.update({
        ...payload,

        is_active: true,
      });

      /* többi rutin deaktiválása */

      await SkinRoutine.update(
        {
          is_active: false,
        },

        {
          where: {
            user_id: userId,

            id: {
              [Op.ne]: existing.id,
            },
          },
        },
      );

      return res.json({
        success: true,

        updated: true,

        routine_id: existing.id,
      });
    }

    /* új rutin */

    const created = await SkinRoutine.create({
      user_id: userId,

      ...payload,

      is_active: true,
    });

    return res.json({
      success: true,

      inserted: true,

      routine_id: created.id,
    });
  } catch (error) {
    console.error("skin save error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

// Rutin lekérése
/**
 * @swagger
 * /api/skin/routine:
 *   get:
 *     summary: Aktív skin routine lekérése
 *     description: A felhasználó aktuálisan aktív bőrápolási rutinját adja vissza
 *     tags: [Skin]
 *     security:
 *       - bearerAuth: []
 *
 *     responses:
 *       200:
 *         description: Aktív rutin lekérve
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 routine:
 *                   nullable: true
 *                   type: object
 *
 *                   properties:
 *
 *                     id:
 *                       type: integer
 *                       example: 1
 *
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *
 *                     skin_type:
 *                       type: string
 *                       example: oily
 *
 *                     age_group:
 *                       type: string
 *                       example: 25_35
 *
 *                     concerns:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - acne
 *                         - redness
 *
 *                     goals:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - hydration
 *                         - anti-aging
 *
 *                     morning_routine:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - cleanser
 *                         - moisturizer
 *                         - sunscreen
 *
 *                     evening_routine:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - cleanser
 *                         - serum
 *                         - night cream
 *
 *                     weekly_treatments:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - exfoliation
 *                         - face mask
 *
 *                     product_recommendations:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - CeraVe cleanser
 *                         - The Ordinary Niacinamide
 *
 *                     tips:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - igyál több vizet
 *                         - ne nyomkodd a pattanásokat
 *
 *                     is_active:
 *                       type: boolean
 *                       example: true
 *
 *                     createdAt:
 *                       type: string
 *                       example: 2026-03-29T10:00:00.000Z
 *
 *                     updatedAt:
 *                       type: string
 *                       example: 2026-03-29T10:00:00.000Z
 *
 *                 message:
 *                   type: string
 *                   example: Nincs mentett rutin
 *
 *       401:
 *         description: Hiányzó vagy hibás token
 *
 *       500:
 *         description: Szerver hiba
 */
app.get("/api/skin/routine", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const routine = await SkinRoutine.findOne({
      where: {
        user_id: userId,

        is_active: true,
      },

      order: [["createdAt", "DESC"]],
    });

    if (!routine) {
      return res.json({
        success: true,

        routine: null,

        message: "Nincs mentett rutin",
      });
    }

    /* JSON mezők parse */

    const parsedRoutine = {
      ...routine.get({ plain: true }),

      concerns: JSON.parse(routine.concerns || "[]"),

      goals: JSON.parse(routine.goals || "[]"),

      morning_routine: JSON.parse(routine.morning_routine || "[]"),

      evening_routine: JSON.parse(routine.evening_routine || "[]"),

      weekly_treatments: JSON.parse(routine.weekly_treatments || "[]"),

      product_recommendations: JSON.parse(
        routine.product_recommendations || "[]",
      ),

      tips: JSON.parse(routine.tips || "[]"),
    };

    console.log("skin routine", routine.id);

    res.json({
      success: true,

      routine: parsedRoutine,
    });
  } catch (error) {
    console.error("skin routine error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

// Rutin követés (napi checkboxok)
/**
 * @swagger
 * /api/skin/tracking:
 *   post:
 *     summary: Napi rutin követés mentése
 *     description: Ment vagy frissít egy napi rutin teljesítést
 *     tags:
 *       - Skin
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *
 *             required:
 *               - routine_id
 *               - date
 *
 *             properties:
 *
 *               routine_id:
 *                 type: integer
 *                 example: 1
 *
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-29
 *
 *               morning_completed:
 *                 type: boolean
 *                 example: true
 *
 *               evening_completed:
 *                 type: boolean
 *                 example: false
 *
 *               morning_steps:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - cleanser
 *                   - moisturizer
 *
 *               evening_steps:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example:
 *                   - cleanser
 *                   - serum
 *
 *               notes:
 *                 type: string
 *                 example: minden rendben ment
 *
 *     responses:
 *
 *       200:
 *         description: sikeres mentés
 *
 *       400:
 *         description: hibás kérés
 *
 *       401:
 *         description: nincs token
 *
 *       500:
 *         description: szerver hiba
 */
app.post("/api/skin/tracking", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      routine_id,
      date,
      morning_completed,
      evening_completed,
      morning_steps,
      evening_steps,
      notes,
    } = req.body;

    if (!routine_id || !date) {
      return res.status(400).json({
        success: false,
        error: "routine_id és date kötelező",
      });
    }

    /* ellenőrizzük hogy a rutin a useré */

    const routine = await SkinRoutine.findOne({
      where: {
        id: routine_id,
        user_id: userId,
      },
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        error: "routine nem található ehhez a userhez",
      });
    }

    /* meglévő tracking keresése */

    const existing = await SkinRoutineTracking.findOne({
      where: {
        routine_id,
        date,
      },
    });

    if (existing) {
      await existing.update({
        morning_completed,
        evening_completed,

        morning_steps: JSON.stringify(morning_steps || []),

        evening_steps: JSON.stringify(evening_steps || []),

        notes,
      });
    } else {
      await SkinRoutineTracking.create({
        routine_id,
        date,

        morning_completed,
        evening_completed,

        morning_steps: JSON.stringify(morning_steps || []),

        evening_steps: JSON.stringify(evening_steps || []),

        notes,
      });
    }

    res.json({
      success: true,
      message: "tracking mentve",
    });
  } catch (error) {
    console.error("tracking error", error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
// Napi rutin követés lekérése
/**
 * @swagger
 * /api/skin/tracking:
 *   get:
 *     summary: Napi rutin követés lekérése
 *     description: Egy adott rutin napi állapotának lekérdezése
 *     tags: [Skin]
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: query
 *         name: routine_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 3
 *
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         example: 2026-03-29
 *
 *
 *     responses:
 *
 *       200:
 *         description: tracking adat
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 tracking:
 *                   nullable: true
 *                   type: object
 *
 *                   properties:
 *
 *                     id:
 *                       type: integer
 *                       example: 15
 *
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *
 *                     routine_id:
 *                       type: integer
 *                       example: 3
 *
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: 2026-03-29
 *
 *                     morning_completed:
 *                       type: boolean
 *                       example: true
 *
 *                     evening_completed:
 *                       type: boolean
 *                       example: false
 *
 *                     morning_steps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - cleanser
 *                         - moisturizer
 *
 *                     evening_steps:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example:
 *                         - cleanser
 *                         - retinol
 *
 *                     notes:
 *                       type: string
 *                       example: ma csak reggel csináltam meg
 *
 *                     createdAt:
 *                       type: string
 *                       example: 2026-03-29T08:00:00.000Z
 *
 *                     updatedAt:
 *                       type: string
 *                       example: 2026-03-29T08:30:00.000Z
 *
 *
 *       400:
 *         description: routine_id hiányzik
 *
 *       401:
 *         description: nincs token
 *
 *       500:
 *         description: szerver hiba
 */
app.get("/api/skin/tracking", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { routine_id, date } = req.query;

    if (!routine_id) {
      return res.status(400).json({
        success: false,
        error: "routine_id kötelező",
      });
    }

    const tracking = await SkinRoutineTracking.findOne({
      where: {
        routine_id,
        ...(date && { date }),
      },

      include: [
        {
          model: SkinRoutine,

          where: {
            user_id: userId,
          },

          attributes: [],
        },
      ],

      order: [
        ["date", "DESC"],
        ["createdAt", "DESC"],
      ],
    });

    if (!tracking) {
      return res.json({
        success: true,
        tracking: null,
      });
    }

    res.json({
      success: true,

      tracking: {
        ...tracking.get({ plain: true }),

        morning_steps: JSON.parse(tracking.morning_steps || "[]"),

        evening_steps: JSON.parse(tracking.evening_steps || "[]"),
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ====== ADMIN API ====== */
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: "A username es password kotelezo.",
    });
  }

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      error: "Hibas admin bejelentkezesi adatok.",
    });
  }

  const token = jwt.sign(
    {
      role: "admin",
      username,
    },
    ADMIN_JWT_SECRET,
    { expiresIn: "12h" },
  );

  res.json({
    success: true,
    token,
  });
});

app.get("/api/admin/overview", authenticateAdminToken, async (req, res) => {
  try {
    const [
      users_count,
      food_entries_count,
      workout_entries_count,
      skin_routines_count,
      total_food_calories,
      total_burned_calories,
    ] = await Promise.all([
      User.count(),
      FoodEntry.count(),
      WorkoutEntry.count(),
      SkinRoutine.count(),
      FoodEntry.sum("calories"),
      WorkoutEntry.sum("calories_burned"),
    ]);

    res.json({
      success: true,
      overview: {
        users_count,
        food_entries_count,
        workout_entries_count,
        skin_routines_count,
        total_food_calories: Number(total_food_calories || 0),
        total_burned_calories: Number(total_burned_calories || 0),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Szerver hiba: " + error.message,
    });
  }
});

app.get("/api/admin/users", authenticateAdminToken, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 200), 1000);

    const users = await sequelize.query(
      `
      SELECT
        u.id,
        u.username,
        u.email,
        u.created_at,
        (SELECT COUNT(*) FROM food_entries fe WHERE fe.user_id = u.id) AS food_entries,
        (SELECT COUNT(*) FROM workout_entries we WHERE we.user_id = u.id) AS workout_entries,
        (SELECT COUNT(*) FROM skin_routines sr WHERE sr.user_id = u.id) AS skin_routines,
        (SELECT COALESCE(SUM(fe.calories), 0) FROM food_entries fe WHERE fe.user_id = u.id) AS total_food_calories,
        (SELECT COALESCE(SUM(we.calories_burned), 0) FROM workout_entries we WHERE we.user_id = u.id) AS total_burned_calories
      FROM users u
      ORDER BY u.created_at DESC
      LIMIT :limit
      `,
      {
        replacements: { limit },
        type: QueryTypes.SELECT,
      },
    );

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Szerver hiba: " + error.message,
    });
  }
});

app.delete("/api/admin/users/:id", authenticateAdminToken, async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      error: "Ervenytelen user id.",
    });
  }

  try {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        "DELETE FROM skin_routine_tracking WHERE user_id = :userId",
        { replacements: { userId }, transaction },
      );
      await SkinRoutine.destroy({ where: { user_id: userId }, transaction });
      await sequelize.query(
        "DELETE FROM skin_condition_log WHERE user_id = :userId",
        {
          replacements: { userId },
          transaction,
        },
      );
      await FoodEntry.destroy({ where: { user_id: userId }, transaction });
      await WorkoutEntry.destroy({ where: { user_id: userId }, transaction });
      await UserProfile.destroy({ where: { user_id: userId }, transaction });

      const affectedRows = await User.destroy({
        where: { id: userId },
        transaction,
      });
      if (!affectedRows) {
        throw new Error("USER_NOT_FOUND");
      }
    });

    res.json({
      success: true,
      message: "Felhasznalo torolve.",
    });
  } catch (error) {
    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        error: "Felhasznalo nem talalhato.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Szerver hiba: " + error.message,
    });
  }
});

/* ====== START ====== */
app.listen(3000, () => {
  console.log("Backend fut: http://localhost:3000");
});
