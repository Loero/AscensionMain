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
      "http://localhost:5174",
      "http://127.0.0.1:5501",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
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

async function ensureMentalTablesSchema() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS mental_routines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      primary_goal VARCHAR(30) NULL,
      daily_time VARCHAR(10) NULL,
      reading_habit VARCHAR(20) NULL,
      stress_level VARCHAR(20) NULL,
      sleep_quality VARCHAR(20) NULL,
      tasks LONGTEXT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_user_active (user_id, is_active),
      CONSTRAINT mental_routines_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS mental_routine_tracking (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      routine_id INT NOT NULL,
      date DATE NOT NULL,
      completed_task_ids LONGTEXT NULL,
      completed_count INT DEFAULT 0,
      required_count INT DEFAULT 0,
      percent INT DEFAULT 0,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_mental_routine_date (user_id, routine_id, date),
      KEY idx_user_date (user_id, date),
      KEY routine_id (routine_id),
      CONSTRAINT mental_routine_tracking_ibfk_1 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT mental_routine_tracking_ibfk_2 FOREIGN KEY (routine_id) REFERENCES mental_routines(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

try {
  await ensureMentalTablesSchema();
  console.log("✅ Mental táblák ellenőrizve");
} catch (err) {
  console.error("❌ Mental tábla inicializálási hiba:", err);
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

const AlcoholEntry = sequelize.define(
  "AlcoholEntry",
  {
    drink_type: DataTypes.STRING,
    amount_ml: DataTypes.FLOAT,
    alcohol_percentage: DataTypes.FLOAT,
    calories: DataTypes.FLOAT,
    date: DataTypes.DATEONLY,
  },
  {
    tableName: "alcohol_entries",
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
  {
    tableName: "skin_routines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
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

    user_id: {
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
    createdAt: "created_at",
    updatedAt: false,
  },
);

const MentalRoutine = sequelize.define(
  "MentalRoutine",
  {
    primary_goal: DataTypes.STRING,
    daily_time: DataTypes.STRING,
    reading_habit: DataTypes.STRING,
    stress_level: DataTypes.STRING,
    sleep_quality: DataTypes.STRING,
    tasks: DataTypes.TEXT,
    is_active: DataTypes.BOOLEAN,
  },
  {
    tableName: "mental_routines",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const MentalRoutineTracking = sequelize.define(
  "MentalRoutineTracking",
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    completed_task_ids: {
      type: DataTypes.TEXT,
    },
    completed_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    required_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    percent: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "mental_routine_tracking",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

User.hasOne(UserProfile, { foreignKey: "user_id" });
User.hasMany(FoodEntry, { foreignKey: "user_id" });
User.hasMany(WorkoutEntry, { foreignKey: "user_id" });
User.hasMany(AlcoholEntry, { foreignKey: "user_id" });
User.hasMany(SkinRoutine, { foreignKey: "user_id" });
User.hasMany(MentalRoutine, { foreignKey: "user_id" });

SkinRoutine.hasMany(SkinRoutineTracking, {
  foreignKey: "routine_id",
});

MentalRoutine.hasMany(MentalRoutineTracking, {
  foreignKey: "routine_id",
});

SkinRoutineTracking.belongsTo(SkinRoutine, {
  foreignKey: "routine_id",
});

MentalRoutineTracking.belongsTo(MentalRoutine, {
  foreignKey: "routine_id",
});

const JWT_SECRET = "ascension_secret_2026";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || JWT_SECRET;

function authenticateAdminToken(req, res, next) {
  const authHeader =
    req.headers["authorization"] || req.headers["Authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Admin token hianyzik.",
    });
  }

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    if (decoded?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Nincs admin jogosultsag.",
      });
    }

    req.admin = {
      username: decoded.username,
    };

    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: "Ervenytelen vagy lejart admin token.",
    });
  }
}

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

/* ====== CLOUDINARY ====== */
cloudinary.config({
  cloud_name: "dpgrckgpd",
  api_key: "971153315419944",
  api_secret: "8Il9Me1gW-ZOK-hkwjazlT_rMYM",
});

/* ====== USDA FoodData Central ====== */
const FDC_API_KEY =
  process.env.FDC_API_KEY || "dVZB801iAYTee9gse3M24mw2rYVtxkjpd2kW3jT3";

function parseFoodNutrients(foodNutrients = []) {
  const toNum = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const getValue = (predicate) => {
    const match = foodNutrients.find(predicate);
    return match?.value ?? 0;
  };

  const energyKcal = toNum(
    getValue(
      (n) =>
        n.nutrientId === 1008 ||
        n.nutrientNumber === "1008" ||
        (n.nutrientName === "Energy" && n.unitName === "KCAL"),
    ),
  );

  const proteinG = toNum(
    getValue(
      (n) =>
        n.nutrientId === 1003 ||
        n.nutrientNumber === "1003" ||
        n.nutrientName === "Protein",
    ),
  );

  const carbG = toNum(
    getValue(
      (n) =>
        n.nutrientId === 1005 ||
        n.nutrientNumber === "1005" ||
        n.nutrientName === "Carbohydrate, by difference",
    ),
  );

  const fatG = toNum(
    getValue(
      (n) =>
        n.nutrientId === 1004 ||
        n.nutrientNumber === "1004" ||
        n.nutrientName === "Total lipid (fat)",
    ),
  );

  return {
    energyKcal,
    proteinG,
    carbG,
    fatG,
  };
}

async function searchUsdaFoods(query) {
  const fdcUrl = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  fdcUrl.searchParams.set("api_key", FDC_API_KEY);
  fdcUrl.searchParams.set("query", query);
  fdcUrl.searchParams.set("pageSize", "12");

  const response = await fetch(fdcUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "USDA API hiba");
  }

  return Array.isArray(data?.foods)
    ? data.foods.map((food) => ({
        fdcId: String(food.fdcId || `${food.description || "food"}`),
        description: food.description || "Ismeretlen étel",
        dataType: food.dataType || "USDA",
        brandOwner: food.brandOwner || "",
        nutrients: parseFoodNutrients(food.foodNutrients),
      }))
    : [];
}

async function searchOpenFoodFactsFoods(query) {
  const offUrl = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  offUrl.searchParams.set("search_terms", query);
  offUrl.searchParams.set("search_simple", "1");
  offUrl.searchParams.set("action", "process");
  offUrl.searchParams.set("json", "1");
  offUrl.searchParams.set("page_size", "12");

  const response = await fetch(offUrl);
  const data = await response.json();

  if (!response.ok) {
    throw new Error("OpenFoodFacts API hiba");
  }

  const products = Array.isArray(data?.products) ? data.products : [];

  return products
    .map((product) => {
      const nutriments = product?.nutriments || {};
      const energyKcal = Number(
        nutriments["energy-kcal_100g"] ??
          nutriments["energy-kcal"] ??
          nutriments["energy_100g"] ??
          0,
      );
      const proteinG = Number(nutriments.proteins_100g ?? 0);
      const carbG = Number(nutriments.carbohydrates_100g ?? 0);
      const fatG = Number(nutriments.fat_100g ?? 0);

      return {
        fdcId: String(
          product.code || product.id || product._id || Math.random(),
        ),
        description:
          product.product_name ||
          product.generic_name ||
          product.brands ||
          "Ismeretlen étel",
        dataType: "OpenFoodFacts",
        brandOwner: product.brands || "",
        nutrients: {
          energyKcal: Number.isFinite(energyKcal) ? energyKcal : 0,
          proteinG: Number.isFinite(proteinG) ? proteinG : 0,
          carbG: Number.isFinite(carbG) ? carbG : 0,
          fatG: Number.isFinite(fatG) ? fatG : 0,
        },
      };
    })
    .filter((item) => item.description && item.description.trim().length > 0);
}

app.get("/nutrition/search", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();

    if (!query) {
      return res.json({ success: true, items: [] });
    }

    let items = [];
    let source = "USDA";

    try {
      items = await searchUsdaFoods(query);
    } catch (usdaError) {
      console.warn("nutrition search USDA fallback", usdaError.message);
      items = await searchOpenFoodFactsFoods(query);
      source = "OpenFoodFacts";
    }

    return res.json({ success: true, items, source });
  } catch (error) {
    console.error("nutrition search error", error);
    return res.status(500).json({
      success: false,
      error: "Nem sikerült lekérni a tápanyag adatokat.",
    });
  }
});

/* ====== SEGÉD ====== */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
/* ====== ALCOHOL TRACKING ENDPOINTS ====== */

// Alkohol bejegyzés hozzáadása

/**
 * @swagger
 * /api/alcohol/add:
 *   post:
 *     summary: Alkohol bejegyzés hozzáadása
 *     description: Új alkohol fogyasztás rögzítése mennyiséggel és kalóriával
 *     tags:
 *       - Alcohol
 *
 *     security:
 *       - bearerAuth: []
 *
 *     requestBody:
 *       required: true
 *
 *       content:
 *         application/json:
 *
 *           schema:
 *             type: object
 *
 *             required:
 *               - drinkType
 *               - amountMl
 *               - alcoholPercentage
 *               - calories
 *               - date
 *
 *             properties:
 *
 *               drinkType:
 *                 type: string
 *                 example: beer
 *
 *               amountMl:
 *                 type: number
 *                 example: 500
 *
 *               alcoholPercentage:
 *                 type: number
 *                 example: 5
 *
 *               calories:
 *                 type: number
 *                 example: 210
 *
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-29
 *
 *     responses:
 *
 *       200:
 *         description: sikeres mentés
 *
 *         content:
 *           application/json:
 *
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
 *                   example: Alkohol mentve
 *
 *                 entryId:
 *                   type: integer
 *                   example: 7
 *
 *       400:
 *         description: hiányzó mező
 *
 *       401:
 *         description: nincs token
 *
 *       500:
 *         description: szerver hiba
 */
app.post("/api/alcohol/add", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { drinkType, amountMl, alcoholPercentage, calories, date } = req.body;

    /* validáció */

    if (
      !drinkType ||
      !amountMl ||
      alcoholPercentage === undefined ||
      !calories ||
      !date
    ) {
      return res.status(400).json({
        success: false,

        error: "Minden mező kötelező",
      });
    }

    /* ORM insert */

    const entry = await AlcoholEntry.create({
      user_id: userId,

      drink_type: drinkType,

      amount_ml: amountMl,

      alcohol_percentage: alcoholPercentage,

      calories: calories,

      date: date,
    });

    console.log("alcohol mentve", entry.id);

    res.json({
      success: true,

      message: "Alkohol mentve",

      entryId: entry.id,
    });
  } catch (error) {
    console.error("alcohol create error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});

// Alkohol bejegyzések lekérése (adott dátum vagy időszak)
/**
 * @swagger
 * /api/alcohol/entries:
 *   get:
 *     summary: Alkohol bejegyzések lekérése
 *     description: A felhasználó alkohol fogyasztási naplója, opcionális dátum szűréssel
 *     tags:
 *       - Alcohol
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
 *         description: Időintervallum kezdete
 *         example: 2026-03-01
 *
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Időintervallum vége
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
 *                         example: 5
 *
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *
 *                       drink_type:
 *                         type: string
 *                         example: beer
 *
 *                       amount_ml:
 *                         type: number
 *                         example: 500
 *
 *                       alcohol_percentage:
 *                         type: number
 *                         example: 5
 *
 *                       calories:
 *                         type: number
 *                         example: 210
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

app.get("/api/alcohol/entries", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const { date, startDate, endDate } = req.query;

    /* WHERE feltétel építése */

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

    const entries = await AlcoholEntry.findAll({
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
    console.error("alcohol list error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});
// Alkohol bejegyzés törlése
/**
 * @swagger
 * /api/alcohol/{id}:
 *   delete:
 *     summary: Alkohol bejegyzés törlése
 *     description: A felhasználó saját alkohol bejegyzésének törlése ID alapján
 *     tags:
 *       - Alcohol
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
 *         description: törlendő alkohol bejegyzés ID
 *
 *         example: 8
 *
 *     responses:
 *
 *       200:
 *         description: sikeres törlés
 *
 *         content:
 *           application/json:
 *
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
 *                   example: Bejegyzés törölve
 *
 *       404:
 *         description: nincs ilyen rekord vagy nem a felhasználóé
 *
 *       401:
 *         description: nincs token
 *
 *       500:
 *         description: szerver hiba
 */
app.delete("/api/alcohol/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const entryId = req.params.id;

    /* törlés csak saját rekordra */

    const deletedCount = await AlcoholEntry.destroy({
      where: {
        id: entryId,

        user_id: userId,
      },
    });

    /* ha nem létezett vagy nem a user-é */

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,

        error: "Bejegyzés nem található",
      });
    }

    console.log("alcohol törölve", entryId);

    res.json({
      success: true,

      message: "Bejegyzés törölve",
    });
  } catch (error) {
    console.error("alcohol delete error", error);

    res.status(500).json({
      success: false,

      error: error.message,
    });
  }
});
// Alkohol statisztikák (összes kalória, ml stb. adott időszakra)
/**
 * @swagger
 * /api/alcohol/stats:
 *   get:
 *     summary: Alkohol statisztikák lekérése
 *     description: Alkohol fogyasztás összesített statisztikái opcionális dátum szűréssel
 *     tags:
 *       - Alcohol
 *
 *     security:
 *       - bearerAuth: []
 *
 *     parameters:
 *
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: statisztika kezdő dátuma
 *         example: 2026-03-01
 *
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: statisztika záró dátuma
 *         example: 2026-03-31
 *
 *     responses:
 *
 *       200:
 *         description: statisztika sikeresen lekérve
 *
 *         content:
 *           application/json:
 *
 *             schema:
 *               type: object
 *
 *               properties:
 *
 *                 success:
 *                   type: boolean
 *                   example: true
 *
 *                 stats:
 *                   type: object
 *
 *                   properties:
 *
 *                     totalEntries:
 *                       type: integer
 *                       example: 12
 *
 *                     totalMl:
 *                       type: number
 *                       example: 3500
 *
 *                     totalCalories:
 *                       type: number
 *                       example: 1850
 *
 *                     avgAlcoholPercentage:
 *                       type: number
 *                       example: 6.25
 *
 *       401:
 *         description: nincs token
 *
 *       500:
 *         description: szerver hiba
 */
app.get("/api/alcohol/stats", authenticateToken, async (req, res) => {
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

    /* ORM aggregáció */

    const stats = await AlcoholEntry.findOne({
      attributes: [
        [fn("COUNT", col("id")), "total_entries"],

        [fn("SUM", col("amount_ml")), "total_ml"],

        [fn("SUM", col("calories")), "total_calories"],

        [fn("AVG", col("alcohol_percentage")), "avg_alcohol_percentage"],
      ],

      where: whereClause,

      raw: true,
    });

    res.json({
      success: true,

      stats: {
        totalEntries: stats.total_entries || 0,

        totalMl: stats.total_ml || 0,

        totalCalories: stats.total_calories || 0,

        avgAlcoholPercentage: stats.avg_alcohol_percentage
          ? Number(stats.avg_alcohol_percentage).toFixed(2)
          : 0,
      },
    });
  } catch (error) {
    console.error("alcohol stats error", error);

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

    if (
      !workoutType ||
      !exerciseName ||
      !durationMinutes ||
      !caloriesBurned ||
      !date
    ) {
      return res.status(400).json({
        success: false,

        error: "Hiányzó kötelező mező",
      });
    }

    /* ORM insert */

    const workout = await WorkoutEntry.create({
      user_id: userId,

      workout_type: workoutType,

      exercise_name: exerciseName,

      duration_minutes: durationMinutes,

      calories_burned: caloriesBurned,

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
        ["updated_at", "DESC"],

        ["created_at", "DESC"],
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

      order: [["created_at", "DESC"]],
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
        user_id: userId,
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
        ["created_at", "DESC"],
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

/* ====== MENTAL ROUTINE ENDPOINTS ====== */

/**
 * @swagger
 * /api/mental/save-routine:
 *   post:
 *     summary: Mentális rutin mentése
 *     tags: [Mental]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [answers, routineTasks]
 *             properties:
 *               answers:
 *                 type: object
 *               routineTasks:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Mentális rutin mentve
 *       400:
 *         description: Hibás kérés
 *       401:
 *         description: Nincs token
 *       500:
 *         description: Szerver hiba
 */
app.post("/api/mental/save-routine", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { answers, routineTasks } = req.body;

    const getNextRoutineId = async () => {
      const maxId = await MentalRoutine.max("id");
      const normalized = Number.isFinite(Number(maxId)) ? Number(maxId) : 0;
      return normalized + 1;
    };

    const tasks = Array.isArray(routineTasks) ? routineTasks : [];
    if (!tasks.length) {
      return res.status(400).json({
        success: false,
        error: "A routineTasks tömb kötelező.",
      });
    }

    const payload = {
      primary_goal: answers?.primaryGoal || null,
      daily_time: answers?.dailyTime || null,
      reading_habit: answers?.readingHabit || null,
      stress_level: answers?.stressLevel || null,
      sleep_quality: answers?.sleepQuality || null,
      tasks: JSON.stringify(tasks),
      is_active: true,
    };

    const normalizeJsonArray = (value) => {
      try {
        return JSON.stringify(JSON.parse(value || "[]"));
      } catch {
        return JSON.stringify([]);
      }
    };

    const existing = await MentalRoutine.findOne({
      where: {
        user_id: userId,
        is_active: true,
      },
      order: [
        ["updated_at", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    if (existing) {
      const hasNoChanges =
        String(existing.primary_goal || "") ===
          String(payload.primary_goal || "") &&
        String(existing.daily_time || "") ===
          String(payload.daily_time || "") &&
        String(existing.reading_habit || "") ===
          String(payload.reading_habit || "") &&
        String(existing.stress_level || "") ===
          String(payload.stress_level || "") &&
        String(existing.sleep_quality || "") ===
          String(payload.sleep_quality || "") &&
        normalizeJsonArray(existing.tasks) === payload.tasks;

      if (hasNoChanges) {
        let safeRoutineId = Number(existing.id) || 0;
        if (safeRoutineId <= 0) {
          safeRoutineId = await getNextRoutineId();
          await existing.update({ id: safeRoutineId });
        }

        return res.json({
          success: true,
          unchanged: true,
          routine_id: safeRoutineId,
        });
      }

      await existing.update(payload);

      let safeRoutineId = Number(existing.id) || 0;
      if (safeRoutineId <= 0) {
        safeRoutineId = await getNextRoutineId();
        await existing.update({ id: safeRoutineId });
      }

      await MentalRoutine.update(
        { is_active: false },
        {
          where: {
            user_id: userId,
            id: { [Op.ne]: existing.id },
          },
        },
      );

      return res.json({
        success: true,
        updated: true,
        routine_id: safeRoutineId,
      });
    }

    const nextRoutineId = await getNextRoutineId();
    const created = await MentalRoutine.create({
      id: nextRoutineId,
      user_id: userId,
      ...payload,
    });

    return res.json({
      success: true,
      inserted: true,
      routine_id: Number(created.id) || nextRoutineId,
    });
  } catch (error) {
    console.error("mental routine save error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/mental/routine:
 *   get:
 *     summary: Mentális rutin lekérése
 *     tags: [Mental]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktív mentális rutin (vagy null)
 *       401:
 *         description: Nincs token
 *       500:
 *         description: Szerver hiba
 */
app.get("/api/mental/routine", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const routine = await MentalRoutine.findOne({
      where: {
        user_id: userId,
        is_active: true,
      },
      order: [["created_at", "DESC"]],
    });

    if (!routine) {
      return res.json({
        success: true,
        routine: null,
        message: "Nincs mentett mentális rutin",
      });
    }

    const parsedRoutine = {
      ...routine.get({ plain: true }),
      tasks: JSON.parse(routine.tasks || "[]"),
      answers: {
        primaryGoal: routine.primary_goal,
        dailyTime: routine.daily_time,
        readingHabit: routine.reading_habit,
        stressLevel: routine.stress_level,
        sleepQuality: routine.sleep_quality,
      },
    };

    return res.json({
      success: true,
      routine: parsedRoutine,
    });
  } catch (error) {
    console.error("mental routine get error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/mental/routines:
 *   get:
 *     summary: Mentális rutinok listázása
 *     description: A felhasználó mentális rutinjainak listája (újabb elöl)
 *     tags: [Mental]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mentális rutinok listája
 *       401:
 *         description: Nincs token
 *       500:
 *         description: Szerver hiba
 */
app.get("/api/mental/routines", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const routines = await MentalRoutine.findAll({
      where: {
        user_id: userId,
      },
      order: [
        ["is_active", "DESC"],
        ["updated_at", "DESC"],
        ["created_at", "DESC"],
      ],
      limit: 50,
    });

    const parsed = routines.map((routine) => ({
      ...routine.get({ plain: true }),
      tasks: JSON.parse(routine.tasks || "[]"),
      answers: {
        primaryGoal: routine.primary_goal,
        dailyTime: routine.daily_time,
        readingHabit: routine.reading_habit,
        stressLevel: routine.stress_level,
        sleepQuality: routine.sleep_quality,
      },
    }));

    return res.json({
      success: true,
      count: parsed.length,
      routines: parsed,
    });
  } catch (error) {
    console.error("mental routines list error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/mental/routine/{id}:
 *   delete:
 *     summary: Mentális rutin deaktiválása
 *     description: Egy userhez tartozó mentális rutin inaktiválása
 *     tags: [Mental]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Mentális rutin deaktiválva
 *       400:
 *         description: Hibás azonosító
 *       401:
 *         description: Nincs token
 *       404:
 *         description: Nincs ilyen rutin
 *       500:
 *         description: Szerver hiba
 */
app.delete("/api/mental/routine/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const routineId = Number(req.params.id || 0);

    if (!routineId) {
      return res.status(400).json({
        success: false,
        error: "Érvénytelen routine id",
      });
    }

    const routine = await MentalRoutine.findOne({
      where: {
        id: routineId,
        user_id: userId,
      },
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        error: "Mentális rutin nem található",
      });
    }

    await routine.update({ is_active: false });

    const latestOther = await MentalRoutine.findOne({
      where: {
        user_id: userId,
        id: { [Op.ne]: routineId },
      },
      order: [
        ["updated_at", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    if (latestOther) {
      await latestOther.update({ is_active: true });
    }

    return res.json({
      success: true,
      message: "Mentális rutin deaktiválva",
    });
  } catch (error) {
    console.error("mental routine delete error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/mental/tracking:
 *   post:
 *     summary: Napi mentális teljesítés mentése
 *     tags: [Mental]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [routine_id, date]
 *             properties:
 *               routine_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               completed_task_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *               completed_count:
 *                 type: integer
 *               required_count:
 *                 type: integer
 *               percent:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mentális tracking mentve
 *       400:
 *         description: Hibás kérés
 *       401:
 *         description: Nincs token
 *       404:
 *         description: Nincs ilyen routine
 *       500:
 *         description: Szerver hiba
 */
app.post("/api/mental/tracking", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      routine_id,
      date,
      completed_task_ids,
      completed_count,
      required_count,
      percent,
      notes,
    } = req.body;

    if (!routine_id || !date) {
      return res.status(400).json({
        success: false,
        error: "routine_id és date kötelező",
      });
    }

    const routine = await MentalRoutine.findOne({
      where: {
        id: routine_id,
        user_id: userId,
      },
    });

    if (!routine) {
      return res.status(404).json({
        success: false,
        error: "Mental routine nem található ehhez a userhez",
      });
    }

    const existing = await MentalRoutineTracking.findOne({
      where: {
        routine_id,
        date,
      },
    });

    const payload = {
      completed_task_ids: JSON.stringify(
        Array.isArray(completed_task_ids) ? completed_task_ids : [],
      ),
      completed_count: Number(completed_count || 0),
      required_count: Number(required_count || 0),
      percent: Number(percent || 0),
      notes: notes || null,
    };

    if (existing) {
      await existing.update(payload);
    } else {
      await MentalRoutineTracking.create({
        user_id: userId,
        routine_id,
        date,
        ...payload,
      });
    }

    return res.json({
      success: true,
      message: "Mental tracking mentve",
    });
  } catch (error) {
    console.error("mental tracking save error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/mental/tracking:
 *   get:
 *     summary: Napi mentális teljesítés lekérése
 *     tags: [Mental]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: routine_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Mentális tracking adat (vagy null)
 *       400:
 *         description: routine_id hiányzik
 *       401:
 *         description: Nincs token
 *       500:
 *         description: Szerver hiba
 */
app.get("/api/mental/tracking", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { routine_id, date } = req.query;

    if (!routine_id) {
      return res.status(400).json({
        success: false,
        error: "routine_id kötelező",
      });
    }

    const tracking = await MentalRoutineTracking.findOne({
      where: {
        routine_id,
        ...(date && { date }),
      },
      include: [
        {
          model: MentalRoutine,
          where: {
            user_id: userId,
          },
          attributes: [],
        },
      ],
      order: [
        ["date", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    if (!tracking) {
      return res.json({
        success: true,
        tracking: null,
      });
    }

    return res.json({
      success: true,
      tracking: {
        ...tracking.get({ plain: true }),
        completed_task_ids: JSON.parse(tracking.completed_task_ids || "[]"),
      },
    });
  } catch (error) {
    console.error("mental tracking get error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/mental/tracking/history:
 *   get:
 *     summary: Mentális tracking history
 *     description: Mentális napi teljesítések listája (szűrhető időintervallummal)
 *     tags: [Mental]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: routine_id
 *         required: false
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tracking history lista
 *       401:
 *         description: Nincs token
 *       500:
 *         description: Szerver hiba
 */
app.get("/api/mental/tracking/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { routine_id, start_date, end_date, limit } = req.query;

    const parsedLimit = Math.min(100, Math.max(1, Number(limit || 30)));

    const whereTracking = {
      ...(routine_id && { routine_id: Number(routine_id) }),
      ...(start_date || end_date
        ? {
            date: {
              ...(start_date && { [Op.gte]: start_date }),
              ...(end_date && { [Op.lte]: end_date }),
            },
          }
        : {}),
    };

    const items = await MentalRoutineTracking.findAll({
      where: whereTracking,
      include: [
        {
          model: MentalRoutine,
          where: {
            user_id: userId,
          },
          attributes: ["id", "is_active", "primary_goal", "daily_time"],
        },
      ],
      order: [
        ["date", "DESC"],
        ["created_at", "DESC"],
      ],
      limit: parsedLimit,
    });

    return res.json({
      success: true,
      count: items.length,
      items: items.map((item) => ({
        ...item.get({ plain: true }),
        completed_task_ids: JSON.parse(item.completed_task_ids || "[]"),
      })),
    });
  } catch (error) {
    console.error("mental tracking history error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * @swagger
 * /api/mental/stats:
 *   get:
 *     summary: Mentális statisztika lekérése
 *     description: Aktív rutin + mai százalék + utóbbi napok összesítése
 *     tags: [Mental]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mentál statisztika
 *       401:
 *         description: Nincs token
 *       500:
 *         description: Szerver hiba
 */
app.get("/api/mental/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date().toISOString().split("T")[0];

    const activeRoutine = await MentalRoutine.findOne({
      where: {
        user_id: userId,
        is_active: true,
      },
      order: [
        ["updated_at", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    if (!activeRoutine) {
      return res.json({
        success: true,
        stats: {
          hasRoutine: false,
          todayPercent: 0,
          weeklyAveragePercent: 0,
          completedDaysLast7: 0,
        },
      });
    }

    const todayTracking = await MentalRoutineTracking.findOne({
      where: {
        routine_id: activeRoutine.id,
        date: today,
      },
      order: [["created_at", "DESC"]],
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    const recent = await MentalRoutineTracking.findAll({
      where: {
        routine_id: activeRoutine.id,
        date: {
          [Op.gte]: sevenDaysAgoStr,
          [Op.lte]: today,
        },
      },
      order: [["date", "DESC"]],
      limit: 7,
    });

    const weeklyAveragePercent = recent.length
      ? Math.round(
          recent.reduce((sum, item) => sum + Number(item.percent || 0), 0) /
            recent.length,
        )
      : 0;

    const completedDaysLast7 = recent.filter(
      (item) => Number(item.percent || 0) >= 100,
    ).length;

    return res.json({
      success: true,
      stats: {
        hasRoutine: true,
        routine_id: activeRoutine.id,
        todayPercent: Number(todayTracking?.percent || 0),
        weeklyAveragePercent,
        completedDaysLast7,
      },
    });
  } catch (error) {
    console.error("mental stats error", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ====== ADMIN ENDPOINTS ====== */
app.post("/api/admin/login", async (req, res) => {
  try {
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
        error: "Hibas admin belepesi adatok.",
      });
    }

    const token = jwt.sign(
      {
        role: "admin",
        username: ADMIN_USERNAME,
      },
      ADMIN_JWT_SECRET,
      { expiresIn: "12h" },
    );

    return res.json({
      success: true,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/admin/overview", authenticateAdminToken, async (req, res) => {
  try {
    const [
      usersCount,
      foodEntriesCount,
      workoutEntriesCount,
      skinRoutinesCount,
    ] = await Promise.all([
      User.count(),
      FoodEntry.count(),
      WorkoutEntry.count(),
      SkinRoutine.count(),
    ]);

    const [foodAgg] = await FoodEntry.findAll({
      attributes: [[fn("COALESCE", fn("SUM", col("calories")), 0), "total"]],
      raw: true,
    });

    const [workoutAgg] = await WorkoutEntry.findAll({
      attributes: [
        [fn("COALESCE", fn("SUM", col("calories_burned")), 0), "total"],
      ],
      raw: true,
    });

    return res.json({
      success: true,
      overview: {
        users_count: Number(usersCount || 0),
        food_entries_count: Number(foodEntriesCount || 0),
        workout_entries_count: Number(workoutEntriesCount || 0),
        skin_routines_count: Number(skinRoutinesCount || 0),
        total_food_calories: Number(foodAgg?.total || 0),
        total_burned_calories: Number(workoutAgg?.total || 0),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.get("/api/admin/users", authenticateAdminToken, async (req, res) => {
  try {
    const rawLimit = Number(req.query.limit || 200);
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.trunc(rawLimit), 1000)
        : 200;

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
      ORDER BY u.id DESC
      LIMIT :limit
      `,
      {
        replacements: { limit },
        type: QueryTypes.SELECT,
      },
    );

    return res.json({
      success: true,
      users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.delete("/api/admin/users/:id", authenticateAdminToken, async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Ervenytelen user id.",
      });
    }

    const deletedCount = await User.destroy({
      where: { id: userId },
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: "Felhasznalo nem talalhato.",
      });
    }

    return res.json({
      success: true,
      message: "Felhasznalo torolve.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* ====== START ====== */
app.listen(3000, () => {
  console.log("Backend fut: http://localhost:3000");
});
