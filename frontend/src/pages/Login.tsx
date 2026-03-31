import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isRegister) {
        await api.post("/auth/register", { email, password });
        alert("Account created! Please login.");
        setIsRegister(false);
        setLoading(false);
        return;
      }
      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);
      const res = await api.post("/auth/login", form);
      localStorage.setItem("token", res.data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "white",
        borderRadius: 20,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 420,
        boxShadow: "0 25px 60px rgba(0,0,0,0.3)"
      }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>
            Creator Audience Pulse
          </h1>
          <p style={{ color: "#64748b", fontSize: 15 }}>
            {isRegister ? "Create your free account" : "Sign in to your dashboard"}
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#dc2626",
            padding: "12px 16px",
            borderRadius: 10,
            fontSize: 14,
            marginBottom: 20
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box",
                transition: "border 0.2s"
              }}
              required
            />
          </div>
          <div style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 15,
                outline: "none",
                boxSizing: "border-box"
              }}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width: "100%",
            padding: "14px",
            background: loading
              ? "#e2e8f0"
              : "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: loading ? "#94a3b8" : "white",
            border: "none",
            borderRadius: 10,
            fontSize: 16,
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 4px 15px rgba(99,102,241,0.4)"
          }}>
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "#64748b" }}>
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <span
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
            style={{ color: "#6366f1", fontWeight: 700, cursor: "pointer" }}
          >
            {isRegister ? "Sign in" : "Sign up free"}
          </span>
        </p>
      </div>
    </div>
  );
}