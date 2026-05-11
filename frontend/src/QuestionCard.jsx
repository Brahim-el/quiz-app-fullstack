export default function QuestionCard({
    q,
    selected,
    handleAnswer,
    nextQuestion,
    timeLeft,
    current,
    total,
}) {
    return (
        <div className="animate-slide space-y-6 max-w-3xl mx-auto">

            {/* number */}
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Question {current + 1} / {total}
            </p>

            {/* question */}
            <h2 className="mb-6 font-bold text-2xl md:text-3xl leading-loose text-center">
                {q.question}
            </h2>
            {/* timer */}
            <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-gray-400">
                    Time Remaining
                </span>

                <span
                    className={`font-bold ${timeLeft <= 5
                        ? "text-red-500"
                        : timeLeft <= 10
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                >
                    {timeLeft}s
                </span>
            </div>
            {/* progress */}
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-800 rounded-full mb-5 overflow-hidden shadow-inner">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${timeLeft <= 5
                        ? "bg-red-500"
                        : timeLeft <= 10
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
            </div>

            {/* answers */}
            <div className="space-y-3">
                {q.choices
                    .filter(c => c && c.trim() !== "")
                    .map((c, i) => {
                        let style =
                            "w-full p-5 rounded-2xl border text-left transition-all duration-200 font-medium";

                        if (selected !== null) {
                            if (c === q.answer) {
                                style += " bg-green-500 text-white border-green-500";
                            } else if (c === selected) {
                                style += " bg-red-500 text-white border-red-500";
                            } else {
                                style += " opacity-50";
                            }
                        } else {
                            style += `
    bg-white text-gray-800
    dark:bg-gray-800 dark:text-white
    border-gray-200 dark:border-gray-600
    hover:bg-blue-500 hover:text-white
    hover:border-blue-500
    hover:shadow-lg hover:scale-[1.02]
  `;
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(c)}
                                disabled={selected !== null}
                                className={style}
                            >
                                {c}
                            </button>
                        );
                    })}
            </div>

            {/* next */}
            {selected && (
                <button
                    onClick={nextQuestion}
                    className="mt-6 w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-105 text-white py-2 rounded-xl shadow-lg transition"
                >
                    Next →
                </button>
            )}

        </div>
    );
}