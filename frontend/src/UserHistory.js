import { useEffect, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

export default function UserHistory({ goBack, darkMode }) {
    const [results, setResults] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [stats, setStats] = useState({ best: 0, avg: 0, total: 0 });
    const [animatedStats, setAnimatedStats] = useState({ best: 0, avg: 0, total: 0 });
    const [view, setView] = useState("summary");

    const username = localStorage.getItem("username");

    useEffect(() => {
        if (!username) return;

        fetch(`${process.env.REACT_APP_API_URL}/my-results?username=${username}`)
            .then((res) => res.json())
            .then((data) => {
                const sortedByDate = [...data].sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );

                const sortedByBest = [...data].sort((a, b) => {
                    const scoreA = a.total > 0 ? a.score / a.total : 0;
                    const scoreB = b.total > 0 ? b.score / b.total : 0;

                    if (scoreB !== scoreA) return scoreB - scoreA;

                    // tie-break بـ XP
                    return (b.xp || 0) - (a.xp || 0);
                });

                setResults(sortedByBest);


                if (data.length > 0) {
                    const percentages = data.map((r) => (r.score / r.total) * 100);

                    const best = Math.round(Math.max(...percentages));
                    const avg = Math.round(
                        percentages.reduce((a, b) => a + b, 0) / percentages.length
                    );

                    setStats({
                        best,
                        avg,
                        total: data.length,
                    });

                    animateNumbers(best, avg, data.length);

                    // 📊 group by date
                    const grouped = {};

                    data.forEach((r) => {
                        const date = new Date(r.createdAt).toLocaleDateString();
                        const percent = r.total > 0 ? (r.score / r.total) * 100 : 0;

                        if (!grouped[date]) {
                            grouped[date] = { total: 0, count: 0 };
                        }

                        grouped[date].total += percent;
                        grouped[date].count += 1;
                    });

                    const formatted = Object.keys(grouped)
                        .map((date) => ({
                            date,
                            percent: Math.round(grouped[date].total / grouped[date].count),
                            rawDate: new Date(date),
                        }))
                        .sort((a, b) => a.rawDate - b.rawDate); // 👈 ترتيب صحيح

                    setChartData(formatted);
                }
            });
    }, [username]);

    // 🔥 number animation
    const animateNumbers = (best, avg, total) => {
        let i = 0;
        const interval = setInterval(() => {
            i++;

            setAnimatedStats({
                best: Math.min(Math.round(best * (i / 20)), best),
                avg: Math.min(Math.round(avg * (i / 20)), avg),
                total: Math.min(Math.round(total * (i / 20)), total),
            });

            if (i >= 20) clearInterval(interval);
        }, 25);
    };

    const bestScore =
        results.length > 0
            ? Math.max(...results.map(r => (r.total > 0 ? r.score / r.total : 0)))
            : 0;

    return (
        <div
            className={`min-h-screen pt-10 px-4 ${darkMode
                ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
                : "bg-gradient-to-br from-blue-50 via-slate-100 to-blue-100 text-gray-800"
                }`}
        >
            <div className="max-w-3xl mx-auto">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">📊 My History</h2>

                    <button
                        onClick={goBack}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:scale-105 transition"
                    >
                        ← Back
                    </button>
                </div>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-4 mb-6">

                    <div
                        className="animate-card card-hover p-4 rounded-xl bg-green-500 text-white text-center shadow"
                        style={{ animationDelay: "0s" }}
                    >
                        <p className="text-sm">Best</p>
                        <p className="text-2xl font-bold">{animatedStats.best}%</p>
                    </div>

                    <div
                        className="animate-card card-hover p-4 rounded-xl bg-blue-500 text-white text-center shadow"
                        style={{ animationDelay: "0.15s" }}
                    >
                        <p className="text-sm">Average</p>
                        <p className="text-2xl font-bold">{animatedStats.avg}%</p>
                    </div>

                    <div
                        className="animate-card card-hover p-4 rounded-xl bg-purple-500 text-white text-center shadow"
                        style={{ animationDelay: "0.3s" }}
                    >
                        <p className="text-sm">Attempts</p>
                        <p className="text-2xl font-bold">{animatedStats.total}</p>
                    </div>

                </div>

                {/* SWITCH */}
                <div className="flex gap-3 mb-6">
                    <button
                        onClick={() => setView("summary")}
                        className={`px-4 py-2 rounded-lg ${view === "summary"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 dark:bg-gray-700"
                            }`}
                    >
                        Summary
                    </button>

                    <button
                        onClick={() => setView("details")}
                        className={`px-4 py-2 rounded-lg ${view === "details"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-300 dark:bg-gray-700"
                            }`}
                    >
                        Details
                    </button>
                </div>

                {/* SUMMARY */}
                {view === "summary" && (
                    <div
                        className={`animate-card card-hover p-4 rounded-xl shadow ${darkMode
                            ? "bg-gray-800/50 border border-gray-700"
                            : "bg-white border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                            }`}
                    >
                        <h3 className="mb-3 font-semibold">📈 Progress</h3>

                        <ResponsiveContainer width="100%" height={250}>
                            {chartData.length === 0 ? (
                                <p className="text-center opacity-60 mt-4">
                                    No data yet... start playing 🚀
                                </p>
                            ) : (
                                <LineChart data={chartData}>
                                    <XAxis dataKey="date" stroke={darkMode ? "#ccc" : "#555"} />
                                    <YAxis domain={[0, 100]} stroke={darkMode ? "#ccc" : "#555"} />

                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: darkMode ? "#1f2937" : "#ffffff",
                                            border: "none",
                                            borderRadius: "10px",
                                            color: darkMode ? "#fff" : "#000",
                                        }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="percent"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4 }}
                                        activeDot={{ r: 6 }}
                                        isAnimationActive={true}
                                        animationDuration={800}
                                    />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                )}

                {/* DETAILS */}
                {view === "details" && (
                    <div className="space-y-3">
                        {results.map((r, i) => {
                            const percent = Math.round((r.score / r.total) * 100);

                            const isBest =
                                (r.score / r.total) === bestScore;
                            let performanceBadge = "";

                            if (percent === 100) performanceBadge = "💎 Perfect";
                            else if (percent >= 80) performanceBadge = "🔥 Excellent";
                            else if (percent >= 50) performanceBadge = "👍 Good";
                            else performanceBadge = "⚠️ Try Again";


                            return (
                                <div
                                    key={i}
                                    className={`animate-card card-hover flex flex-col p-4 rounded-xl shadow ${isBest
                                        ? "border-2 border-yellow-400 bg-gradient-to-r from-yellow-400/20 to-orange-400/20 animate-pulse shadow-lg shadow-yellow-400/20"
                                        : darkMode
                                            ? "bg-gray-800 border border-gray-700"
                                            : "bg-white border border-gray-200 shadow"
                                        }`}
                                    style={{ animationDelay: `${i * 0.08}s` }}
                                >
                                    {isBest && (
                                        <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded-full w-fit mb-2 font-semibold">
                                            🏆 BEST RUN ⭐
                                        </span>
                                    )}
                                    {/* TOP */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm opacity-70">
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </span>

                                        <span className="font-bold">
                                            {r.score} / {r.total}
                                        </span>

                                        <span
                                            className={`font-semibold ${percent >= 50 ? "text-green-400" : "text-red-400"
                                                }`}
                                        >
                                            {percent}%
                                        </span>
                                    </div>

                                    {/* XP */}
                                    <p className="text-xs text-yellow-400 mt-2">
                                        ⭐ {r.xp || 0} XP
                                    </p>

                                    {/* PROGRESS BAR */}
                                    <div className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500"
                                            style={{
                                                width: `${Math.min(((r.xp || 0) % 200) / 200 * 100, 100)}%`
                                            }}
                                        />
                                    </div>

                                    {/* BADGE */}
                                    <p className="text-xs mt-2 opacity-80">
                                        {performanceBadge}
                                    </p>

                                    {/* 🏆 ACHIEVEMENTS */}
                                    {r.achievements && r.achievements.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {r.achievements.map((a, index) => (
                                                <span
                                                    key={index}
                                                    className={`text-xs px-2 py-1 rounded-full ${darkMode
                                                        ? "bg-purple-500/20 text-purple-300"
                                                        : "bg-purple-100 text-purple-700"
                                                        }`}
                                                >
                                                    {a}
                                                </span>
                                            ))}
                                        </div>
                                    )
                                    }
                                </div>
                            );
                        })}
                    </div>
                )
                }

            </div >
        </div >
    );
}