import { useState } from "react";
import Toast from "./Toast";

export default function Login({ onLogin }) {
  const API = "http://localhost:5000";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgot, setIsForgot] = useState(false);

  const [toast, setToast] = useState({ message: "", type: "" });

  // ✅ VALIDATION
  const validate = () => {
    let newErrors = {};

    if (username.trim().length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (password.trim().length < 4) {
      newErrors.password = "Password must be at least 4 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ helper toast
  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 3000);
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (!validate()) return;

    setLoading(true);

    try {
      // REGISTER
      if (isRegister) {
        const res = await fetch(`${API}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (data.success) {
          setIsRegister(false);
          setUsername("");
          setPassword("");
          showToast("Account created!", "success");
        } else {
          showToast(data.message || "Error", "error");
        }

        setLoading(false);
        return;
      }

      // FORGOT PASSWORD
      if (isForgot) {
        const res = await fetch(`${API}/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            newPassword: password,
          }),
        });

        const data = await res.json();

        if (data.success) {
          showToast("Password updated!", "success");
          setIsForgot(false);
          setPassword("");
        } else {
          showToast(data.message || "Error", "error");
        }

        setLoading(false);
        return;
      }

      // ADMIN
      let res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      let data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "admin");
        onLogin("admin");
        return;
      }

      // USER
      res = await fetch(`${API}/user-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", "user");
        onLogin("user");
      } else {
        showToast("Wrong credentials", "error");
      }
    } catch (err) {
      showToast("Server error", "error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
    bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 
    dark:from-gray-900 dark:via-gray-950 dark:to-black 
    transition-colors duration-300">

      <div className="w-full max-w-md p-8 rounded-2xl 
      bg-white/70 dark:bg-gray-900/70 
      backdrop-blur-md 
      shadow-2xl border border-white/20 dark:border-gray-700">

        <h2 className="text-2xl font-bold text-center mb-6 
        text-gray-800 dark:text-white">
          {loading
            ? "Processing..."
            : isForgot
              ? "Reset Password"
              : isRegister
                ? "Register"
                : "Login"}
        </h2>

        {/* USERNAME */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-3">👤</span>

          <input
            value={username}
            placeholder="Username"
            className={`w-full pl-10 p-3 rounded-lg 
            bg-white/80 dark:bg-gray-800 
            border ${errors.username ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
            text-gray-800 dark:text-white 
            focus:outline-none focus:ring-2 focus:ring-blue-500`}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({ ...prev, username: "" }));
            }}
          />
        </div>

        {errors.username && (
          <p className="text-red-500 text-sm mb-2">{errors.username}</p>
        )}

        {/* PASSWORD */}
        <div className="relative mb-3">
          <span className="absolute left-3 top-3">🔒</span>

          <input
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="Password"
            className={`w-full pl-10 p-3 rounded-lg 
            bg-white/80 dark:bg-gray-800 
            border ${errors.password ? "border-red-500" : "border-gray-300 dark:border-gray-600"}
            text-gray-800 dark:text-white 
            focus:outline-none focus:ring-2 focus:ring-blue-500`}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
          />

          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 cursor-pointer text-gray-400"
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {errors.password && (
          <p className="text-red-500 text-sm mb-2">{errors.password}</p>
        )}

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading || !username || !password}
          className={`w-full py-3 rounded-lg font-semibold text-white 
          transition flex items-center justify-center gap-2
          ${loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-105 hover:shadow-xl"
            }`}
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}

          {loading
            ? "Processing..."
            : isRegister
              ? "Register"
              : "Login"}
        </button>

        {/* SWITCH */}
        <p className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          {isRegister ? "Already have an account?" : "No account?"}
          <span
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-500 cursor-pointer hover:underline ml-1"
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>

        <p
          onClick={() => {
            setIsForgot(true);
            setIsRegister(false);
          }}
          className="text-center mt-2 text-sm text-blue-500 cursor-pointer hover:underline"
        >
          Forgot password?
        </p>
      </div>

      {/* ✅ TOAST */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: "" })}
      />
    </div>
  );
}