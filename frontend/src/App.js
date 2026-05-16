import { useEffect, useRef, useState } from "react";
import QuestionCard from "./QuestionCard";
import Leaderboard from "./Leaderboard";
import Login from "./Login";
import Admin from "./Admin";
import Confetti from "react-confetti";
import UserHistory from "./UserHistory";
import GlobalLeaderboard from "./GlobalLeaderboard";
import Profile from "./Profile";


export default function App() {
  const API = "https://quiz-app-fullstack-production.up.railway.app";

  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [questions, setQuestions] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mode, setMode] = useState("quiz");


  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  const QUIZ_TIME = 30;

  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const [darkMode, setDarkMode] = useState(false);

  const [animatedScore, setAnimatedScore] = useState(0);

  const [showGlobal, setShowGlobal] = useState(false);

  const beepRef = useRef(null);
  const role = localStorage.getItem("role");

  const [showProfile, setShowProfile] = useState(false);

  const [resultAchievements, setResultAchievements] = useState([]);

  const [lastResult, setLastResult] = useState(null);

  const [animatedXP, setAnimatedXP] = useState(0);

  const [oldLevel, setOldLevel] = useState(1);
  const [newLevel, setNewLevel] = useState(1);

  const calculateXP = (score, percentage) => {
    let xp = score * 10;

    if (percentage === 100) xp += 50;
    if (percentage >= 50) xp += 20;

    return xp;
  };

  const currentCorrectAnswers =
    questions[current]?.answers ||
    (questions[current]?.answer
      ? [questions[current]?.answer]
      : []);

  const finalScore =
    selected.length === currentCorrectAnswers.length &&
      selected.every(a =>
        currentCorrectAnswers.includes(a)
      )
      ? score + 1
      : score;

  const percentage =
    questions.length > 0
      ? Math.round((finalScore / questions.length) * 100)
      : 0;

  const xp =
    resultAchievements.length > 0
      ? calculateXP(score, percentage)
      : lastResult?.xp || 0;

  // 🌙 THEME
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // 🔐 LOGIN
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setIsAdmin(true);
  }, []);

  // 📥 EXAMS
  useEffect(() => {
    fetch(`${API}/exams`)
      .then((res) => res.json())
      .then(setExams);
  }, []);

  // 📥 QUESTIONS
  useEffect(() => {
    if (!selectedExam) return;

    fetch(`${API}/questions/${selectedExam}`)
      .then((res) => res.json())
      .then((data) => {
        setQuestions(data);
        setCurrent(0);
        setScore(0);
        setFinished(false);
      });
  }, [selectedExam]);

  // ⏱ RESET
  useEffect(() => {
    if (!questions.length) return;
    setTimeLeft(QUIZ_TIME);
    setSelected([]);
    setSubmitted(false);
  }, [current, questions]);

  // ⏱ TIMER
  useEffect(() => {
    if (!questions.length || finished) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          nextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [current, finished, questions]);

  // 🔊 SOUND
  useEffect(() => {
    if (timeLeft <= 3 && timeLeft > 0 && beepRef.current) {
      beepRef.current.currentTime = 0;
      beepRef.current.play().catch(() => { });
    }
  }, [timeLeft]);


  // 🔥 SCORE ANIMATION
  useEffect(() => {
    if (!finished) return;

    setAnimatedScore(0);

    let start = 0;

    const interval = setInterval(() => {
      start++;
      setAnimatedScore(start);

      if (start >= score) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [finished, score]);

  useEffect(() => {
    if (!finished) return;

    const username = localStorage.getItem("username");

    fetch(`${API}/my-results?username=${username}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const sorted = data.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          const last = sorted[0];
          const previous = sorted[1];

          setLastResult(last);

          const getLevel = (xp) => Math.floor(xp / 200) + 1;

          const totalXP = data.reduce((sum, r) => sum + (r.xp || 0), 0);
          const previousXP = data.slice(1).reduce((sum, r) => sum + (r.xp || 0), 0);

          const oldL = getLevel(previousXP);
          const newL = getLevel(totalXP);

          setOldLevel(oldL);
          setNewLevel(newL);
        }
      });
  }, [finished]);

  useEffect(() => {
    if (!finished) return;

    let i = 0;

    const interval = setInterval(() => {
      i += Math.max(1, Math.ceil(xp / 40));

      setAnimatedXP(i);

      if (i >= xp) {
        setAnimatedXP(xp);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [xp, finished]);


  // 💾 SAVE
  const saveResult = async (finalScore) => {
    const username = localStorage.getItem("username") || "Guest";

    return await fetch(`${API}/results`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        examId: selectedExam,
        score: finalScore,
        total: questions.length,
        username,
      }),
    });
  };

  // ⏭ NEXT
  const nextQuestion = async () => {

  const currentCorrectAnswers =
    questions[current]?.answers ||
    (questions[current]?.answer
      ? [questions[current]?.answer]
      : []);

  const lastAnswerCorrect =
    selected.length === currentCorrectAnswers.length &&
    selected.every(a =>
      currentCorrectAnswers.includes(a)
    );

  const finalScoreLocal =
    lastAnswerCorrect
      ? score + 1
      : score;

  setSelected([]);
  setSubmitted(false);

  if (current < questions.length - 1) {
    setCurrent((c) => c + 1);
    return;
  }

  const percentageLocal =
    questions.length > 0
      ? Math.round((finalScoreLocal / questions.length) * 100)
      : 0;

  const isWinner = percentageLocal >= 50;
  const isPerfect = percentageLocal === 100;

  const achievements = [];

  if (isWinner) achievements.push("🎖️ First Win");
  if (isPerfect) achievements.push("💎 Perfect Score");

  setResultAchievements(achievements);

  await saveResult(finalScoreLocal);

  setTimeout(() => {
    setFinished(true);
  }, 300);
};


  // ✅ ANSWER
  const handleAnswer = (choice) => {

    if (selected.includes(choice)) {
      setSelected(
        selected.filter(c => c !== choice)
      );
    } else {
      setSelected([...selected, choice]);
    }
  };

  const submitAnswer = () => {

    setSubmitted(true);

    const correctAnswers =
      questions[current]?.answers ||
      (questions[current]?.answer
        ? [questions[current]?.answer]
        : []);

    const isCorrect =
      selected.length === correctAnswers.length &&
      selected.every(a =>
        correctAnswers.includes(a)
      );

    if (isCorrect) {
      setScore((s) => s + 1);
    }

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  // 🔐 ROUTES
  if (mode === "login") {
    return <Login onLogin={(role) => {
      if (role === "admin") {
        setIsAdmin(true);
        setMode("admin");
      } else {
        setMode("quiz");
      }
    }} />;
  }

  if (mode === "admin") {
    const token = localStorage.getItem("token");
    if (!token) return <Login onLogin={() => setMode("admin")} />;

    return (
      <Admin goBack={() => {
        setMode("quiz");
        setSelectedExam("");
      }} />
    );
  }

  if (showGlobal) {
    return (
      <GlobalLeaderboard
        goBack={() => setShowGlobal(false)}
        darkMode={darkMode}
      />
    );
  }
  if (mode === "history") {
    return (
      <UserHistory
        darkMode={darkMode}
        goBack={() => setMode("quiz")}
      />
    );
  }

  if (showProfile) {
    return <Profile goBack={() => setShowProfile(false)} darkMode={darkMode} />;
  }


  // 🧠 MENU
  if (!selectedExam) {
    return (
      <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-slate-100"} min-h-screen`}>

        {/* NAVBAR */}
        <div className="w-full flex justify-center pt-6 px-4">
          <div className={`w-full max-w-5xl rounded-2xl px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xl border backdrop-blur-xl
  ${darkMode
              ? "bg-gray-800/80 border-gray-700"
              : "bg-white/70 border-white/40"
            }`}>

            <h1 className="font-bold text-2xl">
              🧠 QuizApp
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="bg-green-500 hover:scale-105 transition text-white px-4 py-2 rounded-xl"
              >
                {darkMode ? "☀️" : "🌙"}
              </button>

              <button
                onClick={() => setMode("history")}
                className="bg-indigo-500 hover:scale-105 transition text-white px-4 py-2 rounded-xl"
              >
                📊
              </button>

              <button
                onClick={() => setShowGlobal(true)}
                className="bg-purple-500 hover:scale-105 transition text-white px-4 py-2 rounded-xl"
              >
                🌍
              </button>

              {!role ? (
                <button
                  onClick={() => setMode("login")}
                  className="bg-blue-500 hover:scale-105 transition text-white px-4 py-2 rounded-xl"
                >
                  🔐
                </button>
              ) : (
                <>
                  {role === "admin" && (
                    <button
                      onClick={() => setMode("admin")}
                      className="bg-green-500 hover:scale-105 transition text-white px-4 py-2 rounded-xl"
                    >
                      ⚙️
                    </button>
                  )}

                  {role === "user" && (
                    <button
                      onClick={() => setShowProfile(true)}
                      className="bg-yellow-500 hover:scale-105 transition text-white px-4 py-2 rounded-xl"
                    >
                      👤
                    </button>
                  )}

                  <button
                    onClick={() => {
                      localStorage.clear();
                      setIsAdmin(false);
                      setMode("quiz");
                      setSelectedExam("");
                    }}
                    className="bg-red-500 hover:scale-105 transition text-white px-4 py-2 rounded-xl"
                  >
                    🚪
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MENU */}
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center py-10">
          <div className={`p-8 rounded-2xl shadow-xl w-full max-w-lg animate-fade-in ${darkMode ? "bg-gray-800 text-white" : "bg-white/80 backdrop-blur-md border border-white/40 shadow-xl text-gray-800"
            }`}>

            <h2 className="font-bold mb-6 text-center text-xl">📚 Choose Exam</h2>

            <div className="grid gap-4">
              {exams.map((e) => (
                <div
                  key={e._id}
                  onClick={() => setSelectedExam(e._id)}
                  className="cursor-pointer p-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-[1.03] transition flex justify-between"
                >
                  <span>{e.title}</span>
                  <span>➡️</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (!questions.length) return <div className="p-10">Loading...</div>;

  if (finished) {

    const isWinner = percentage >= 50;

    const isPerfect = percentage === 100;

    // const getAchievements = () => {
    //   const badges = [];

    //   if (isWinner) badges.push("🎖️ First Win");
    //   if (isPerfect) badges.push("💎 Perfect Score");

    //   return badges;
    // };

    const getBadgeStyle = (badge) => {
      if (badge.includes("Perfect"))
        return "bg-purple-500/20 text-purple-400";

      if (badge.includes("First Win"))
        return "bg-yellow-500/20 text-yellow-300";

      if (badge.includes("Win"))
        return "bg-yellow-500/20 text-yellow-400";

      if (badge.includes("Streak"))
        return "bg-orange-500/20 text-orange-400";

      return "bg-indigo-500/20 text-indigo-400";
    };

    const leveledUp = newLevel > oldLevel;

    const achievements =
      lastResult?.achievements?.length > 0
        ? lastResult.achievements
        : resultAchievements;

    return (
      <div
        className={`min-h-screen pt-16 pb-10 flex flex-col items-center justify-start px-4 ${darkMode
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
          : "bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100 text-gray-800"
          }`}
      >
        {/* 🎉 Confetti */}
        {percentage >= 80 && <Confetti />}

        {/* RESULT */}
        <div className="text-center mb-6 animate-fade-in">
          <h2 className="text-3xl font-bold">🎉 Result</h2>

          <p className="text-5xl font-extrabold mt-3">
            {finalScore} / {questions.length}
          </p>

          <p className="text-2xl mt-2 text-blue-500 font-bold">
            {percentage}%
          </p>

          <p className="mt-3 text-gray-500 dark:text-gray-300">
            {percentage === 100
              ? "Perfect 🔥"
              : percentage > 70
                ? "Excellent 🚀"
                : percentage > 50
                  ? "Good 👍"
                  : "Keep practicing 💪"}
          </p>

          <p className="mt-2 text-yellow-400 font-bold">
            ⭐ {animatedXP} XP
          </p>

          {/* هنا */}
          {leveledUp && (
            <div className="mt-4 text-xl font-bold text-green-400 animate-bounce">
              🚀 LEVEL UP!
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2 justify-center">
            {achievements.map((a, i) => (
              <div
                key={i}
                className={`px-3 py-1 rounded-full text-sm font-medium animate-fadeUp ${getBadgeStyle(a)}`}
              >
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* LEADERBOARD */}
        <div className="w-full max-w-md mt-4 p-5 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-slate-700">
          <Leaderboard examId={selectedExam} />
        </div>
      </div>
    );
  }


  const q = questions[current];

  // 🧠 QUIZ
  return (
    <div className={`${darkMode
      ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
      : "bg-gradient-to-br from-blue-100 via-white to-purple-100"
      } min-h-screen`}>

      <div className="max-w-4xl mx-auto px-4 pt-6">

        {/* TOP BAR */}
        <div className={`flex flex-col md:flex-row md:justify-between md:items-center gap-3 px-4 md:px-8 py-4 rounded-xl mb-6 ${darkMode
          ? "bg-gray-800"
          : "bg-white/80 backdrop-blur-md border border-white/40 shadow-xl"
          }`}>
          <button onClick={() => setSelectedExam("")} className="font-bold">
            🧠 QuizApp
          </button>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-sm md:text-base">
            <span>Score: {score}</span>

            <span>
              Question {current + 1} / {questions.length}
            </span>

            <span className={timeLeft <= 5 ? "text-red-500 font-bold" : ""}>
              ⏱️ {timeLeft}s
            </span>
          </div>
        </div>

        <span className="text-sm text-gray-400">
          {Math.round(((current + 1) / questions.length) * 100)}%
        </span>

        <div className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-in-out"
            style={{
              width: `${((current + 1) / questions.length) * 100}%`
            }}
          />
        </div>


        {/* QUESTION */}
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className={`w-full max-w-xl p-8 rounded-3xl transition-all ${darkMode ? "bg-gray-900 border border-gray-700 shadow-2xl"
            : "bg-white border border-gray-200 shadow-2xl"
            }`}>

            <audio ref={beepRef} src="https://www.soundjay.com/button/beep-07.wav" />

            <QuestionCard
              q={q}
              selected={selected}
              handleAnswer={handleAnswer}
              submitAnswer={submitAnswer}
              nextQuestion={nextQuestion}
              submitted={submitted}
              timeLeft={timeLeft}
              current={current}
              total={questions.length}
            />

          </div>
        </div>

      </div>
    </div>

  );
}