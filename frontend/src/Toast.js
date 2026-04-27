export default function Toast({ message, type, onClose }) {
  if (!message) return null;

  const bg =
    type === "success"
      ? "bg-green-500"
      : type === "error"
      ? "bg-red-500"
      : "bg-gray-700";

  return (
    <div className="fixed top-5 right-5 z-50 animate-slideIn">
      <div
        className={`${bg} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3`}
      >
        <span>
          {type === "success" ? "✅" : type === "error" ? "❌" : "ℹ️"}
        </span>

        <span className="text-sm">{message}</span>

        <button
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white"
        >
          ✖
        </button>
      </div>
    </div>
  );
}