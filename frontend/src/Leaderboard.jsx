import { useEffect, useState } from "react";

export default function Leaderboard({ examId }) {
    const [results, setResults] = useState([]);
    const currentUser = localStorage.getItem("username");

    useEffect(() => {
        fetch(`${process.env.REACT_APP_API_URL}/results?examId=${examId}`)
            .then((res) => res.json())
            .then((data) => {
                const sorted = data.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return new Date(a.createdAt) - new Date(b.createdAt);
                });

                setResults(sorted.slice(0, 10));
            });
    }, [examId]);

    return (
        <div className="flex flex-col items-center 
        bg-white dark:bg-gray-900/80 text-gray-800 dark:text-white 
        p-5 rounded-2xl shadow-xl backdrop-blur-md">

            {/* title */}
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                🏆 Leaderboard
            </h2>

            <p className="text-sm mb-4 text-gray-400">
                Top 10 players
            </p>

            {/* empty state */}
            {results.length === 0 && (
                <p className="text-gray-400 py-6">
                    No results yet 😴
                </p>
            )}

            {/* list */}
            <div className="w-full max-w-md">
                {results.map((r, i) => {
                    let bg =
                        "bg-gray-100 dark:bg-gray-800/50 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700";

                    if (i === 0) {
                        bg = "bg-yellow-400 text-black scale-[1.05] shadow-xl font-bold";
                    } else if (i === 1) {
                        bg = "bg-gray-300 text-black scale-[1.03] shadow-lg";
                    } else if (i === 2) {
                        bg = "bg-orange-400 text-black scale-[1.02] shadow-md";
                    }

                    return (
                        <div
                            key={r._id}
                            className={`flex justify-between items-center p-3 mb-3 rounded-xl transition 
                            ${bg}
                            ${r.username === currentUser ? "ring-2 ring-blue-500" : ""}`}
                        >
                            <span className="font-semibold">
                                {i === 0 && "🥇"}
                                {i === 1 && "🥈"}
                                {i === 2 && "🥉"}
                                {i > 2 && `#${i + 1}`}
                            </span>

                            <span className="truncate max-w-[120px]">
                                {r.username || "Guest"}
                            </span>

                            <span className="font-bold">
                                {Math.round((r.score / r.total) * 100)}%
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* button */}
            <button
                onClick={() => window.location.href = "/"}
                className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 
                hover:scale-105 text-white px-6 py-2 rounded-lg shadow-lg transition"
            >
                ← Back to exams
            </button>

        </div>
    );
}