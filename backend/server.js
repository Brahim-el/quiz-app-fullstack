const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = process.env.JWT_SECRET;


// ✅ CONNECT
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    if (process.env.SEED === "true") {
      console.log("🌱 Seeding...");
      await seedData();
      await createAdmin();
    }
  })
  .catch(err => console.log(err));


// =======================
// 🧠 SCHEMAS
// =======================

const ExamSchema = new mongoose.Schema({
  title: String,
});

const QuestionSchema = new mongoose.Schema({
  question: String,
  choices: [String],
  answers: [String],
  examId: String, // 🔥 ربط مع exam
});

const ResultSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
  score: Number,
  total: Number,
  username: String,
  achievements: [String],
  currentStreak: { type: Number, default: 1 },
  bestStreak: { type: Number, default: 1 },

  xp: { type: Number, default: 0 }, // 👈

  createdAt: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: String,

  totalXP: {
    type: Number,
    default: 0,
  },

  role: {
    type: String,
    default: "user",
  },
});

const User = mongoose.model("User", UserSchema);

const Result = mongoose.model("Result", ResultSchema);

const Exam = mongoose.model("Exam", ExamSchema);
const Question = mongoose.model("Question", QuestionSchema);


// =======================
// 🌱 SEED DATA
// =======================

const seedData = async () => {
  const examCount = await Exam.countDocuments();

  if (examCount === 0) {
    const exam1 = await Exam.create({ title: "كونكور وزارة العدل محررين قضائيين 2026 نموذج 1" });
    const exam2 = await Exam.create({ title: "كونكور وزارة العدل محررين قضائيين 2026 نموذج 2" });

    await Question.insertMany([
      {
        question: "Quel est le langage web côté client ?",
        choices: ["Python", "JavaScript", "C++"],
        answer: "JavaScript",
        examId: exam1._id,
      },
      {
        question: "Que signifie HTML ?",
        choices: [
          "HyperText Markup Language",
          "High-level Text Markup Language",
          "Hyperlink Language",
        ],
        answer: "HyperText Markup Language",
        examId: exam1._id,
      },
      {
        question: "Android language ?",
        choices: ["Python", "Kotlin", "PHP"],
        answer: "Kotlin",
        examId: exam2._id,
      },
    ]);

    console.log("🌱 Seed exams + questions added");
  }
};


// =======================
// 🔐 AUTH
// =======================

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return res.status(401).json({ message: "No token" });

  const token = authHeader.split(" ")[1];

  try {
    jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(403).json({ message: "Invalid token" });
  }
};

// 🔐 LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const cleanUsername = username.toLowerCase().trim();

  const user = await User.findOne({
    username: cleanUsername
  });

  if (!user || user.role !== "admin") {
    return res.json({ success: false });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.json({ success: false });
  }

  const token = jwt.sign(
    { username: cleanUsername },
    SECRET,
    { expiresIn: "1h" }
  );

  res.json({ success: true, token });
});


// =======================
// 📥 EXAMS
// =======================

// GET exams
app.get("/exams", async (req, res) => {
  const exams = await Exam.find();
  res.json(exams);
});

// ADD exam
app.post("/exams", verifyToken, async (req, res) => {
  const exam = new Exam({ title: req.body.title });
  await exam.save();
  res.json(exam);
});


// =======================
// 📥 QUESTIONS
// =======================

// GET questions by exam
app.get("/questions/:examId", async (req, res) => {
  const data = await Question.find({ examId: req.params.examId });
  res.json(data);
});

// ADD question
app.post("/questions", verifyToken, async (req, res) => {
  const { question, choices, answers, examId } = req.body;

  const newQ = new Question({
    question,
    choices,
    answers,
    examId
  });
  await newQ.save();

  res.json({ message: "added" });
});

// UPDATE
app.put("/questions/:id", verifyToken, async (req, res) => {
  const { question, choices, answers } = req.body;

  const updated = await Question.findByIdAndUpdate(
    req.params.id,
    { question, choices, answers },
    { new: true }
  );

  res.json(updated);
});

// DELETE
app.delete("/questions/:id", verifyToken, async (req, res) => {
  await Question.findByIdAndDelete(req.params.id);
  res.json({ message: "deleted" });
});


app.post("/results", async (req, res) => {
  const { examId, score, total, username } = req.body;

  const xp = Math.round((score / total) * 100);

  const lastResult = await Result.findOne({ username })
    .sort({ createdAt: -1 });

  const percent = total > 0 ? (score / total) * 100 : 0;
  const isWinner = percent >= 50;



  let currentStreak = 0;
  let bestStreak = 0;

  let newAchievements = [];

  if (lastResult) {
    const lastDate = new Date(lastResult.createdAt);
    const now = new Date();

    lastDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);

    if (!isWinner) {
      currentStreak = 0;
    } else if (diffDays === 1) {
      currentStreak = (lastResult.currentStreak || 0) + 1;
    } else if (diffDays === 0) {
      currentStreak = lastResult.currentStreak || 1;
    } else {
      currentStreak = 1;
    }

    bestStreak = Math.max(
      currentStreak,
      lastResult.bestStreak || 0
    );
    // 🏆 GET OLD ACHIEVEMENTS
    const userResults = await Result.find({ username });

    const unlocked = new Set();

    userResults.forEach(r => {
      if (r.achievements) {
        r.achievements.forEach(a => unlocked.add(a));
      }
    });

    // 🆕 NEW ACHIEVEMENTS

    if (percent >= 50 && !unlocked.has("🎖️ First Win")) {
      newAchievements.push("🎖️ First Win");
    }

    if (percent === 100 && !unlocked.has("💎 Perfect Score")) {
      newAchievements.push("💎 Perfect Score");
    }

    if (percent >= 80 && !unlocked.has("🔥 Score 80%")) {
      newAchievements.push("🔥 Score 80%");
    }

    // 🔥 streak achievements
    if (currentStreak >= 3 && !unlocked.has("🔥 Streak 3")) {
      newAchievements.push("🔥 Streak 3");
    }

    if (currentStreak >= 5 && !unlocked.has("🚀 Streak 5")) {
      newAchievements.push("🚀 Streak 5");
    }
  } else {
    currentStreak = isWinner ? 1 : 0;
    bestStreak = currentStreak;

    if (percent >= 50) newAchievements.push("🎖️ First Win");
    if (percent === 100) newAchievements.push("💎 Perfect Score");
  }

  const result = new Result({
    examId,
    score,
    total,
    username: username.toLowerCase().trim(),
    achievements: newAchievements,
    xp,
    currentStreak,
    bestStreak,
  });

  await result.save();

  // 🔥 UPDATE USER TOTAL XP
  await User.findOneAndUpdate(
    { username: username.toLowerCase().trim() },
    { $inc: { totalXP: xp } }
  );

  res.json({ message: "result saved" });
});

app.get("/results", async (req, res) => {
  try {
    const { examId } = req.query;

    let query = {};

    // 👇 إلا كان examId → filter
    if (examId) {
      query.examId = examId;
    }

    const results = await Result.find(query);

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/stats", async (req, res) => {
  try {
    const examsCount = await Exam.countDocuments();
    const questionsCount = await Question.countDocuments();
    const usersCount = await User.countDocuments();

    const results = await Result.find().populate("examId");

    res.json({
      exams: examsCount,
      questions: questionsCount,
      users: usersCount,
      results: results.map(r => ({
        name: r.examId?.title || "Unknown",
        score: Math.round((r.score / r.total) * 100),
        createdAt: r.createdAt
      }))
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    const cleanUsername = username.toLowerCase().trim();

    const existingUser = await User.findOne({
      username: cleanUsername
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username: cleanUsername,
      password: hashedPassword,
      totalXP: 0,
      role: "user"
    });

    await user.save();

    res.json({
      success: true,
      message: "Account created!"
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Server error"
    });
  }
});

app.post("/user-login", async (req, res) => {
  const { username, password } = req.body;

  const cleanUsername = username.toLowerCase().trim();

  const user = await User.findOne({
    username: cleanUsername
  });
  if (!user) {
    return res.json({ success: false });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.json({ success: false });
  }

  const token = jwt.sign(
    { username: cleanUsername },
    SECRET,
    { expiresIn: "1h" }
  );
  res.json({ success: true, token, username });
});

app.get("/my-results", async (req, res) => {
  try {
    const { username } = req.query;

    const results = await Result.find({ username })
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/leaderboard", async (req, res) => {
  const users = await User.find({ role: "user" }); // 🔥 ماشي admin

  const data = await Promise.all(
    users.map(async (u) => {
      const last = await Result.findOne({ username: u.username })
        .sort({ createdAt: -1 });

      return {
        username: u.username,
        totalXP: u.totalXP,
        currentStreak: last?.currentStreak || 0,
      };
    })
  );

  // 🧠 XP + streak
  data.sort((a, b) => {
    if (b.totalXP === a.totalXP) {
      return b.currentStreak - a.currentStreak;
    }
    return b.totalXP - a.totalXP;
  });

  res.json(data.slice(0, 10));
});

app.post("/forgot-password", async (req, res) => {
  const { username, newPassword } = req.body;

  const cleanUsername = username.toLowerCase().trim();

  const user = await User.findOne({
    username: cleanUsername
  });

  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  user.password = hashed;
  await user.save();

  res.json({ success: true, message: "Password updated" });
});

const createAdmin = async () => {
  const admin = await User.findOne({ username: "admin" });

  if (!admin) {
    const hash = await bcrypt.hash("1234", 10);

    await User.create({
      username: "admin",
      password: hash,
      role: "admin",
    });

    console.log("✅ Admin created");
  }
};

app.delete("/exams/:id", verifyToken, async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.params.id);

    // optional: حذف questions ديال هاد exam
    await Question.deleteMany({
      examId: req.params.id
    });

    res.json({ message: "Exam deleted" });

  } catch (err) {
    res.status(500).json({
      message: "Delete failed"
    });
  }
});

app.put("/exams/:id", verifyToken, async (req, res) => {
  try {
    const updated = await Exam.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title },
      { new: true }
    );

    res.json(updated);

  } catch (err) {
    res.status(500).json({
      message: "Update failed"
    });
  }
});

// =======================
// 🚀 START
// =======================

app.listen(5000, () => {
  console.log("server 5000");
});