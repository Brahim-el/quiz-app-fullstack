export default function QuestionCard({
    q,
    selected,
    handleAnswer,
    submitAnswer,
    submitted,
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

                        const active = selected.includes(c);

                        const correctAnswers =
                            q.answers || (q.answer ? [q.answer] : []);

                        const isCorrect =
                            correctAnswers.includes(c);


                        let style = `
        w-full p-5 rounded-2xl border text-left
        transition-all duration-300 font-medium
        flex items-center gap-4
      `;

                        if (submitted) {

                            if (isCorrect) {
                                style += `
            bg-green-500
            border-green-500
            text-white
          `;
                            }

                            else if (active && !isCorrect) {
                                style += `
            bg-red-500
            border-red-500
            text-white
          `;
                            }

                            else {
                                style += `
            opacity-50
            bg-gray-800
            border-gray-700
          `;
                            }

                        } else {

                            style += `
          bg-white text-gray-800
          dark:bg-gray-800 dark:text-white
          border-gray-200 dark:border-gray-600
          hover:bg-blue-500 hover:text-white
          hover:border-blue-500
          hover:scale-[1.02]
        `;
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleAnswer(c)}
                                disabled={submitted}
                                className={style}
                            >

                                <div className={`
            min-w-[24px]
            h-6
            rounded-md
            border-2
            flex
            items-center
            justify-center
            text-sm
            font-bold
            transition-all

            ${active
                                        ? "bg-white text-blue-500 border-white"
                                        : "border-gray-400"
                                    }
          `}>
                                    {active ? "✓" : ""}
                                </div>

                                <span>{c}</span>

                            </button>
                        );
                    })}
            </div>

            {/* next */}
            {selected.length > 0 && !submitted && (
                <button
                    onClick={submitAnswer}
                    className="mt-6 w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-105 text-white py-2 rounded-xl shadow-lg transition"
                >
                    Next →
                </button>
            )}

        </div>
    );
}