import { useEffect, useState } from "react";

export default function Profile({ goBack, darkMode }) {
    const [userData, setUserData] = useState(null);

    const username = localStorage.getItem("username");


    useEffect(() => {
        if (!username) return;

        fetch(`${process.env.REACT_APP_API_URL}/my-results?username=${username}`)
            .then(res => res.json())
            .then(data => {

                if (!data || data.length === 0) {

                    setUserData({
                        best: 0,
                        avg: 0,
                        total: 0,
                        achievements: [],
                        xp: 0,
                        currentStreak: 0,
                        bestStreak: 0,
                    });

                    return;
                }

                const percentages = data.map(r =>
                    r.total > 0 ? (r.score / r.total) * 100 : 0
                );

                const totalXP = data.reduce((sum, r) => sum + (r.xp || 0), 0);

                const best = Math.max(...percentages);

                const avg =
                    percentages.reduce((a, b) => a + b, 0) / percentages.length;

                const currentStreak = data[0]?.currentStreak || 0;

                const allAchievements = new Set();

                data.forEach(r => {
                    if (r.achievements) {
                        r.achievements.forEach(a => allAchievements.add(a));
                    }
                });

                setUserData({
                    best: Math.round(best),
                    avg: Math.round(avg),
                    total: data.length,
                    achievements: Array.from(allAchievements),
                    xp: totalXP,
                    currentStreak,
                    bestStreak: data.length > 0
                        ? Math.max(...data.map(r => r.bestStreak || 0))
                        : 0,
                });
            })
            .catch(err => {
                console.error(err);

                setUserData({
                    best: 0,
                    avg: 0,
                    total: 0,
                    achievements: [],
                    xp: 0,
                    currentStreak: 0,
                    bestStreak: 0,
                });
            });

    }, [username]);

    // 🎯 LEVEL SYSTEM
    // const getLevel = (xp) => {
    //     if (xp >= 1000) return { label: "Master", color: "from-purple-500 to-indigo-500" };
    //     if (xp >= 500) return { label: "Pro", color: "from-blue-500 to-cyan-500" };
    //     if (xp >= 200) return { label: "Intermediate", color: "from-yellow-500 to-orange-500" };
    //     return { label: "Beginner", color: "from-gray-500 to-gray-700" };
    // };
    const getBadgeStyle = (a) => {
        if (a.includes("Perfect"))
            return darkMode
                ? "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300"
                : "bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700";

        if (a.includes("First Win"))
            return darkMode
                ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300"
                : "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700";

        if (a.includes("Streak"))
            return darkMode
                ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300"
                : "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700";

        return darkMode
            ? "bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-300"
            : "bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700";
    };

    if (!userData) {
        return <div className="text-center mt-20">Loading...</div>;
    }

    // const level = getLevel(userData.xp);

    const getIcon = (a) => {
        if (a.includes("Perfect")) return "💎";
        if (a.includes("First Win")) return "🥇";
        if (a.includes("Streak")) return "🔥";
        return "🏆";
    };

    const getProgress = (xp) => {
        const max = 1000; // max level
        return Math.min((xp / max) * 100, 100);
    };

    const getLevelData = (xp) => {
        const xpPerLevel = 200;

        const level = Math.floor(xp / xpPerLevel) + 1;
        const currentXP = xp % xpPerLevel;
        const neededXP = xpPerLevel;

        return {
            level,
            currentXP,
            neededXP,
            progress: (currentXP / neededXP) * 100
        };
    };

    const levelData = getLevelData(userData.xp);

    const getLevelColor = (level) => {
        if (level >= 5) return "from-purple-500 to-indigo-500";
        if (level >= 3) return "from-blue-500 to-cyan-500";
        if (level >= 2) return "from-green-500 to-emerald-500";
        return "from-gray-500 to-gray-700";
    };

    const getStreakColor = (s) => {
        if (s === 0) return "text-gray-400";
        if (s < 5) return "text-yellow-400";
        if (s < 10) return "text-orange-400";
        return "text-red-400";
    };

    return (
        <div
            className={`min-h-screen flex flex-col items-center justify-center px-4 transition-all duration-500 ${darkMode
                ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white"
                : "bg-gradient-to-br from-indigo-50 via-white to-purple-100 text-gray-800"
                }`}
        >

            {/* CARD */}
            <div
                className={`w-full max-w-md p-6 rounded-2xl shadow-xl animate-fadeUp ${darkMode
                    ? "bg-gray-900/70 border border-gray-700"
                    : "bg-white/90 backdrop-blur-md border border-gray-300 shadow-lg"
                    }`}
            >

                {/* USER */}
                <h2 className="text-xl font-bold text-center mb-2">
                    👤 {username}
                </h2>

                {/* LEVEL */}
                <div className="text-center mb-4">
                    <span
                        className={`px-4 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${getLevelColor(levelData.level)} text-white`}
                    >
                        Level {levelData.level}
                    </span>
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full bg-gray-300 dark:bg-gray-700 rounded-full h-2 mb-6 overflow-hidden">
                    <div
                        className="h-2 rounded-full bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 transition-all duration-700"
                        style={{ width: `${levelData.progress}%` }}
                    />
                </div>

                <p className="text-center mb-2 text-sm opacity-70">
                    ⭐ {userData.xp} XP
                </p>

                <p className="text-center text-xs opacity-60">
                    {levelData.currentXP} / {levelData.neededXP} XP
                </p>

                {/* STATS */}
                <div className="grid grid-cols-3 gap-3 text-center mb-6">
                    <div>
                        <p className="text-sm opacity-70">Best</p>
                        <p className="font-bold">{userData.best}%</p>
                    </div>
                    <div>
                        <p className="text-sm opacity-70">Average</p>
                        <p className="font-bold">{userData.avg}%</p>
                    </div>
                    <div>
                        <p className="text-sm opacity-70">Attempts</p>
                        <p className="font-bold">{userData.total}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center mb-6">
                    <div>
                        <p className="text-sm opacity-70">🔥 Current Streak</p>
                        <p className={`font-bold ${getStreakColor(userData.currentStreak)}`}>
                            {userData.currentStreak}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm opacity-70">🏆 Best Win Streak</p>
                        <p className="font-bold">{userData.bestStreak}</p>
                    </div>
                </div>

                {/* ACHIEVEMENTS */}
                <div>
                    <h3 className="text-sm mb-2 opacity-70">🏆 Achievements</h3>

                    <div className="flex flex-wrap gap-2">
                        {userData.achievements.length > 0 ? (
                            userData.achievements.map((a, i) => (
                                <span
                                    key={i}
                                    className={`text-xs px-3 py-1 rounded-full flex items-center gap-1
    transition-all duration-300 hover:scale-105 hover:shadow-md
    ${getBadgeStyle(a)}
  `}
                                >
                                    {getIcon(a)} {a.replace(/^[^\w]+/, "")}
                                </span>
                            ))
                        ) : (
                            <p className="text-xs opacity-60">No achievements yet</p>
                        )}
                    </div>
                </div>

            </div>

            {/* BACK */}
            <button
                onClick={goBack}
                className="mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-2 rounded-lg text-white hover:scale-105 transition"
            >
                ← Back
            </button>

        </div>
    );
}