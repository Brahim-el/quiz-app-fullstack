import { useEffect, useState } from "react";

export default function GlobalLeaderboard({ goBack, darkMode }) {
    const [results, setResults] = useState([]);
    const currentUser = localStorage.getItem("username");

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/leaderboard`)
            .then(res => res.json())
            .then(data => {
                const sorted = [...data].sort((a, b) => {
                    if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;

                    // tie-break بـ streak
                    return (b.currentStreak || 0) - (a.currentStreak || 0);
                });

                setResults(sorted);
            });
    }, []);

    const getLevel = (xp) => {
        if (xp >= 1000) return { label: "Master", icon: "👑" };
        if (xp >= 500) return { label: "Pro", icon: "🔥" };
        if (xp >= 200) return { label: "Intermediate", icon: "👍" };
        return { label: "Beginner", icon: "💪" };
    };

    return (
        <div
            className={`min-h-screen flex flex-col items-center justify-center px-4 transition-all duration-500
      ${darkMode
                    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
                    : "bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100 text-gray-800"
                }`}
        >
            {/* TITLE */}
            <h2 className="text-2xl md:text-3xl font-bold mb-6 animate-fadeUp">
                🌍 Global Leaderboard
            </h2>

            {/* CARD */}
            <div
                className={`w-full max-w-md p-5 rounded-2xl shadow-xl backdrop-blur-md animate-fadeUp
        ${darkMode
                        ? "bg-gray-900/70 border border-gray-700"
                        : "bg-white/80 border border-gray-200"
                    }`}
            >
                {results.map((r, i) => {
                    let bg = "";

                    if (i === 0) {
                        bg = "bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border-yellow-400 scale-[1.05] animate-[pulse_2s_ease-in-out_3]";
                    } else if (i === 1) {
                        bg = "bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400 scale-[1.03]";
                    } else if (i === 2) {
                        bg = "bg-gradient-to-r from-orange-400/20 to-amber-600/20 border-orange-500";
                    } else {
                        bg = darkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-gray-100 border-gray-200";
                    }

                    const level = getLevel(r.totalXP);
                    return (
                        <div
                            key={i}
                            title={`${r.username} • ${r.totalXP} XP • ${r.currentStreak} streak`}
                            className={`flex justify-between items-center p-3 mb-3 rounded-xl border transition-all duration-300
  hover:scale-[1.02] hover:bg-white/5 ${bg}
  ${r.username === currentUser ? "ring-2 ring-indigo-400 shadow-lg" : ""}
`}
                        >
                            {/* RANK */}
                            <span className="font-semibold">
                                {i === 0 && "🥇"}
                                {i === 1 && "🥈"}
                                {i === 2 && "🥉"}
                                {i > 2 && `#${i + 1}`}
                            </span>

                            {/* USER */}
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span>{i === 0 ? "👑" : level.icon}</span>
                                    <span className="truncate">{r.username}</span>
                                </div>

                                <p className="text-xs opacity-70">
                                    🔥 {r.currentStreak} streak
                                </p>

                                <span className={`text-xs font-semibold ${i === 0 ? "text-indigo-400" : "opacity-70"
                                    }`}>
                                    {level.label}
                                </span>

                                <div className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                    <div
                                        className={`h-full ${r.totalXP >= 800
                                            ? "bg-indigo-500"
                                            : r.totalXP >= 400
                                                ? "bg-blue-400"
                                                : "bg-red-400"
                                            }`}
                                        style={{ width: `${Math.min((r.totalXP % 200) / 2, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <span className={`font-bold ${i === 0 ? "text-yellow-400" : "text-indigo-500"}`}>
                                ⭐ {r.totalXP} XP
                            </span>

                        </div>
                    );
                })}
            </div>

            {/* BUTTON */}
            <button
                onClick={goBack}
                className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-105 text-white px-6 py-2 rounded-lg shadow-lg transition animate-fadeUp"
            >
                ← Back
            </button>
        </div>
    );
}