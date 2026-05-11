import { useEffect, useState } from "react";
import Toast from "./Toast";
import { Cell } from "recharts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function Admin({ goBack }) {
  const API = "https://quiz-app-fullstack-production.up.railway.app";
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("dashboard");

  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [newExam, setNewExam] = useState("");

  const [questions, setQuestions] = useState([]);

  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState(["", "", ""]);
  const [answers, setAnswers] = useState([]);

  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState("");

  const [editingExamId, setEditingExamId] = useState(null);

  const [stats, setStats] = useState({
    exams: 0,
    questions: 0,
    users: 0,
    results: []
  });

  const filteredResults = stats.results.filter((item) => {
    const now = new Date();
    const itemDate = new Date(item.createdAt);

    if (filter === "today") {
      return itemDate.toDateString() === now.toDateString();
    }

    if (filter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return itemDate >= weekAgo;
    }

    return true;
  });

  const [editingId, setEditingId] = useState(null);

  // ================= FETCH =================
  const fetchExams = async () => {
    const res = await fetch(`${API}/exams`);
    const data = await res.json();
    setExams(data);
  };

  const fetchQuestions = async () => {
    if (!examId) return;
    const res = await fetch(`${API}/questions/${examId}`);
    const data = await res.json();
    setQuestions(data);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API}/stats`);
      const data = await res.json();
      setStats(data);
    } catch {
      // fallback demo data
      setStats({
        exams: 5,
        questions: 20,
        users: 10,
        results: [
          { name: "Concours 1", score: 80 },
          { name: "Concours 2", score: 60 },
          { name: "Concours 3", score: 90 }
        ]
      });
    }
  };

  useEffect(() => {
    fetchExams();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  // ================= ACTIONS =================
  const handleAddExam = async () => {
    if (!newExam.trim()) return;

    await fetch(`${API}/exams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newExam.trim() }),
    });

    setNewExam("");
    fetchExams();
  };

  const handleChoiceChange = (value, index) => {
    const newChoices = [...choices];
    const oldValue = newChoices[index];

    newChoices[index] = value;
    setChoices(newChoices);

    // update selected answers
    if (answers.includes(oldValue)) {
      setAnswers(
        answers.map(a => a === oldValue ? value : a)
      );
    }
  };

  const handleAdd = async () => {

    if (!question.trim()) {
      return alert("Question required");
    }
    if (!examId) return alert("Choose exam");

    const cleanChoices = choices
      .map(c => c.trim())
      .filter(c => c !== "");

    const cleanAnswers = answers
      .map(a => a.trim())
      .filter(a => a !== "");

    if (cleanChoices.length < 2) {
      return alert("At least 2 choices required");
    }

    if (
      cleanAnswers.length === 0 ||
      !cleanAnswers.every(a => cleanChoices.includes(a))
    ) {
      return alert("Select valid correct answers");
    }

    await fetch(`${API}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        question: question.trim(),
        choices: cleanChoices,
        answers: cleanAnswers,
        examId
      }),
    });

    resetForm();
    fetchQuestions();
  };

  const handleEdit = (q) => {
    setEditingId(q._id);
    setQuestion(q.question);
    setChoices(q.choices);
    setAnswers(
      q.answers || (q.answer ? [q.answer] : [])
    );
    setActiveTab("questions");
    setExamId(q.examId); // مهم
  };

  const handleUpdate = async () => {

    if (!question.trim()) {
      return alert("Question required");
    }

    if (!editingId) return;
    // 🧼 تنظيف choices
    const cleanChoices = choices
      .map(c => c.trim())
      .filter(c => c !== "");

    // 🧼 تنظيف answer
    const cleanAnswers = answers
      .map(a => a.trim())
      .filter(a => a !== "");

    // ❌ أقل من 2 اختيارات
    if (cleanChoices.length < 2) {
      return alert("At least 2 choices required");
    }

    // ❌ answer ماشي valid
    if (
      cleanAnswers.length === 0 ||
      !cleanAnswers.every(a => cleanChoices.includes(a))
    ) {
      return alert("Select valid correct answers");
    }

    try {
      await fetch(`${API}/questions/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: question.trim(),
          choices: cleanChoices,
          answers: cleanAnswers,
        }),
      });
      setToast("Updated successfully");

      // ✅ reset form
      setQuestion("");
      setChoices(["", "", ""]);
      setAnswers([]);
      setEditingId(null);

      // 🔄 refresh questions
      fetchQuestions();

    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${API}/questions/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    fetchQuestions();
  };

  const handleRemoveChoice = (index) => {
    if (choices.length <= 2) return; // ما نخليوش أقل من 2

    const newChoices = choices.filter((_, i) => i !== index);
    setChoices(newChoices);

    // إلا كان answer هو هداك اللي تحيد، نحيدوه
    if (answers.includes(choices[index])) {
      setAnswers(
        answers.filter(a => a !== choices[index])
      );
    }
  };

  const handleDeleteExam = async (id) => {

    const confirmDelete = window.confirm(
      "Delete this exam?"
    );

    if (!confirmDelete) return;

    await fetch(`${API}/exams/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    fetchExams();
  };

  const handleEditExam = (exam) => {
    setEditingExamId(exam._id);
    setNewExam(exam.title);
  };

  const handleUpdateExam = async () => {

    if (!newExam.trim()) return;

    await fetch(`${API}/exams/${editingExamId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: newExam.trim(),
      }),
    });

    setEditingExamId(null);
    setNewExam("");

    fetchExams();
  };



  const resetForm = () => {
    setQuestion("");
    setChoices(["", "", ""]);
    setAnswers([]);
    setEditingId(null);
    setExamId("");
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 text-white px-3 py-2 rounded shadow text-sm border border-gray-700">
          <p>{payload[0].payload.name}</p>
          <p className="text-blue-400 font-bold">
            {payload[0].value}%
          </p>
        </div>
      );
    }
    return null;
  };

  const groupedData = Object.values(
    filteredResults.reduce((acc, item) => {
      if (!acc[item.name]) {
        acc[item.name] = { name: item.name, total: 0, count: 0 };
      }

      acc[item.name].total += item.score;
      acc[item.name].count += 1;

      return acc;
    }, {})
  ).map(item => ({
    name: item.name,
    score: Math.round(item.total / item.count)
  }));

  // ================= UI =================
  return (
    <div className="
min-h-screen
bg-gray-100 dark:bg-gray-900
text-gray-800 dark:text-white
transition
flex flex-col md:flex-row
">

      {/* SIDEBAR */}
      <div className="
w-full md:w-60
md:h-screen
sticky top-0
p-4
bg-white dark:bg-gray-800
border-r dark:border-gray-700
overflow-y-auto
shrink-0
">
        <h1 className="text-xl font-bold mb-6">⚙️ Admin</h1>

        <div className="flex md:flex-col gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`block mb-2 px-3 py-2 rounded-lg transition ${activeTab === "dashboard"
              ? "bg-blue-500 text-white shadow-lg"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            📊 Dashboard
          </button>


          <button
            onClick={() => setActiveTab("exams")}
            className={`block mb-2 px-3 py-2 rounded-lg transition ${activeTab === "exams"
              ? "bg-blue-500 text-white"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            📚 Exams
          </button>

          <button
            onClick={() => setActiveTab("questions")}
            className={`block mb-2 px-3 py-2 rounded-lg transition ${activeTab === "questions"
              ? "bg-blue-500 text-white"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
          >
            ❓ Questions
          </button>

          <button
            onClick={goBack}
            className="mt-10 bg-red-500 px-3 py-1 rounded hover:bg-red-600"
          >
            ⬅ Exit
          </button>
        </div>
        </div>

        {/* CONTENT */}
        <div className="
flex-1
p-4 md:p-6
overflow-y-auto
overflow-x-hidden
">

          <Toast
            message={toast}
            onClose={() => setToast("")}
          />

          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">📊 Dashboard</h2>

              {/* CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card title="Exams" value={stats.exams} />
                <Card title="Questions" value={stats.questions} />
                <Card title="Users" value={stats.users} />
                <Card title="Results" value={stats.results?.length} />
              </div>

              <div className="flex gap-2 mb-4">
                {["today", "week", "all"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-sm transition ${filter === f
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 dark:bg-gray-700"
                      }`}
                  >
                    {f === "today" && "Today"}
                    {f === "week" && "This Week"}
                    {f === "all" && "All Time"}
                  </button>
                ))}
              </div>

              {/* CHART */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow">
                <h2 className="mb-4 font-semibold">Results Overview</h2>

                {stats.results.length === 0 ? (
                  <div className="text-center text-gray-400 py-16">
                    📊 No results yet
                    <p className="text-sm mt-2">Start by adding exams and users</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={groupedData}>

                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />

                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />

                      <YAxis
                        domain={[0, 100]}
                        stroke="#94a3b8"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />

                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={false}
                      />

                      <Bar
                        dataKey="score"
                        fill="url(#colorScore)"
                        radius={[8, 8, 0, 0]}
                        isAnimationActive={true}
                      >
                        {
                          groupedData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={"url(#colorScore)"} />
                          ))
                        }
                      </Bar>

                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#1e40af" stopOpacity={1} />
                        </linearGradient>
                      </defs>

                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* EXAMS */}
          {activeTab === "exams" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">📚 Manage Exams</h2>

              <div className="flex gap-2 mb-4">
                <input
                  value={newExam}
                  onChange={(e) => setNewExam(e.target.value)}
                  placeholder="New Exam"
                  className="input"
                />
                <button
                  onClick={
                    editingExamId
                      ? handleUpdateExam
                      : handleAddExam
                  }
                  className="btn-purple"
                >
                  {editingExamId ? "Update" : "Add"}
                </button>
              </div>
              <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-2">
                {exams.map((e) => (
                  <div
                    key={e._id}
                    className="card flex justify-between items-center"
                  >
                    <span>{e.title}</span>

                    <div className="
flex flex-row md:flex-col
gap-2
shrink-0
w-full md:w-auto
">

                      <button
                        onClick={() => handleEditExam(e)}
                        className="btn-blue"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteExam(e._id)}
                        className="btn-red"
                      >
                        Delete
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* QUESTIONS */}
          {activeTab === "questions" && (
            <div>
              <h2 className="text-2xl font-bold mb-4">❓ Questions</h2>

              <select
                value={examId}
                onChange={(e) => setExamId(e.target.value)}
                className="input"
              >
                <option value="">Choose exam</option>
                {exams.map((e) => (
                  <option key={e._id} value={e._id}>
                    {e.title}
                  </option>
                ))}
              </select>

              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Question"
                className="input"
              />

              {choices.map((c, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={c}
                    placeholder={`Choice ${i + 1}`}
                    onChange={(e) => handleChoiceChange(e.target.value, i)}
                    className="input flex-1"
                  />

                  {choices.length > 2 && (
                    <button
                      onClick={() => handleRemoveChoice(i)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      ❌
                    </button>
                  )}
                </div>
              ))}

              <button
                disabled={choices.length >= 6}
                onClick={() => {
                  if (choices.some(c => c.trim() === "")) {
                    return alert("Fill existing choices first");
                  }

                  setChoices([...choices, ""]);
                }}
                className={`mt-4 mb-3 px-4 py-2 rounded-lg shadow transition
  ${choices.length >= 6
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:scale-105"
                  }`}
              >
                Add choice
              </button>

              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-400">
                  Select correct answers
                </p>

                {choices
                  .filter(c => c && c.trim() !== "")
                  .map((c, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-2 bg-gray-800 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={answers.includes(c)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAnswers([...answers, c]);
                          } else {
                            setAnswers(
                              answers.filter(a => a !== c)
                            );
                          }
                        }}
                      />

                      <span>{c}</span>
                    </label>
                  ))}
              </div>

              <button
                onClick={editingId ? handleUpdate : handleAdd}
                className="btn-green mt-5"
              >
                {editingId ? "Update" : "Add"}
              </button>

              <div className="mt-4 max-h-[55vh] overflow-y-auto pr-2 space-y-2">
                {questions.map((q) => (
                  <div key={q._id} className="
card
flex flex-col md:flex-row
justify-between
items-start
gap-4
">
                    <div>
                      <div className="flex-1">

                        <p className="font-bold text-xl mb-4">
                          {q.question}
                        </p>

                        <div className="space-y-2">
                          {q.choices.map((choice, i) => {

                            const correctAnswers =
                              q.answers || (q.answer ? [q.answer] : []);

                            const ok =
                              correctAnswers.includes(choice);

                            return (
                              <div
                                key={i}
                                className={`
            px-3 py-2 rounded-lg border text-sm
            ${ok
                                    ? "bg-green-500/20 border-green-500 text-green-400"
                                    : "bg-gray-800 border-gray-700 text-gray-300"
                                  }
          `}
                              >
                                {ok ? "✔ " : "• "}
                                {choice}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(q.answers || q.correctAnswers || []).map((a, i) => (
                          <span
                            key={i}
                            className="
        bg-green-500/20
        text-green-400
        border border-green-500/30
        px-3 py-1
        rounded-full
        text-xs
        font-semibold
      "
                          >
                            ✔ {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="
flex flex-row md:flex-col
gap-2
shrink-0
w-full md:w-auto
">
                      <button onClick={() => handleEdit(q)} className="btn-blue">Edit</button>
                      <button onClick={() => handleDelete(q._id)} className="btn-red">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
  );
}

/* 🔹 SMALL COMPONENT */
function Card({ title, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow border dark:border-gray-700 transition hover:scale-[1.02] hover:shadow-xl">
      <p className="text-gray-400">{title}</p>
      <h3 className="text-xl font-bold">{value}</h3>
    </div>
  );
}