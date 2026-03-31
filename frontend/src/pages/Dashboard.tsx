import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function Dashboard() {
  const [platform, setPlatform] = useState("instagram");
  const [retention, setRetention] = useState<any[]>([]);
  const [churn, setChurn] = useState<any>(null);
  const [fatigue, setFatigue] = useState<any>(null);
  const [forecast, setForecast] = useState<number[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const fetchAnalytics = async () => {
    try {
      const [r, c, f, fc] = await Promise.all([
        api.get(`/analytics/retention?platform=${platform}`),
        api.get(`/analytics/churn-risk?platform=${platform}`),
        api.get(`/analytics/content-fatigue?platform=${platform}`),
        api.get(`/analytics/forecast?platform=${platform}`),
      ]);
      setRetention(r.data.data.map((d: any) => ({
        ...d, post_date: d.post_date?.slice(0, 10)
      })));
      setChurn(c.data);
      setFatigue(f.data);
      setForecast(fc.data.forecast);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setFile(null);
    setUploadMsg("");
    setLoading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    fetchAnalytics();
  }, [platform]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setUploadMsg("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await api.post(`/data/upload/${platform}`, form);
      setUploadMsg(res.data.message || "Upload successful!");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchAnalytics();
    } catch (err: any) {
      setUploadMsg(err.response?.data?.detail || "Upload failed — check your CSV format");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const churnColor = !churn ? "#94a3b8"
    : churn.score > 55 ? "#ef4444"
    : churn.score > 25 ? "#f59e0b"
    : "#22c55e";

  const isError = uploadMsg.toLowerCase().includes("fail") ||
    uploadMsg.toLowerCase().includes("error");

  const platformIcons: Record<string, string> = {
    instagram: "📸",
    youtube: "🎬",
    newsletter: "📧"
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      background: "linear-gradient(135deg, #f0f2f5 0%, #e8ecf0 100%)",
      display: "flex",
      flexDirection: "column"
    }}>

      {/* Nav */}
      <nav style={{
        background: "linear-gradient(90deg, #1e1b4b 0%, #312e81 100%)",
        padding: "0 40px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 2px 20px rgba(0,0,0,0.2)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>📊</span>
          <div>
            <div style={{ color: "white", fontWeight: 700, fontSize: 18 }}>
              Creator Audience Pulse
            </div>
            <div style={{ color: "#a5b4fc", fontSize: 12 }}>
              Audience Analytics Platform
            </div>
          </div>
        </div>
        <button onClick={logout} style={{
          padding: "8px 20px",
          background: "rgba(255,255,255,0.1)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14
        }}>
          Logout
        </button>
      </nav>

      {/* Content */}
      <div style={{ flex: 1, padding: "32px 40px", maxWidth: 1400, width: "100%", margin: "0 auto" }}>

        {/* Platform Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {["instagram", "youtube", "newsletter"].map(p => (
            <button key={p} onClick={() => setPlatform(p)} style={{
              padding: "10px 24px",
              background: platform === p
                ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                : "white",
              color: platform === p ? "white" : "#64748b",
              border: platform === p ? "none" : "1px solid #e2e8f0",
              borderRadius: 10,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: platform === p
                ? "0 4px 15px rgba(99,102,241,0.4)"
                : "0 1px 3px rgba(0,0,0,0.05)"
            }}>
              {platformIcons[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Upload Card */}
        <div style={{
          background: "white",
          borderRadius: 16,
          padding: "24px 28px",
          marginBottom: 28,
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          border: "1px solid #f1f5f9"
        }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1e293b" }}>
              Upload {platform.charAt(0).toUpperCase() + platform.slice(1)} Data
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
              Upload a CSV export from your {platform} account
            </div>
          </div>

          <form onSubmit={handleUpload} style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={e => {
                setFile(e.target.files?.[0] || null);
                setUploadMsg("");
              }}
              style={{
                flex: 1,
                padding: "9px 14px",
                border: "1px dashed #cbd5e1",
                borderRadius: 8,
                fontSize: 14,
                color: "#475569",
                background: "#f8fafc",
                cursor: "pointer"
              }}
            />
            <button
              type="submit"
              disabled={loading || !file}
              style={{
                padding: "10px 28px",
                background: loading || !file
                  ? "#e2e8f0"
                  : "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: loading || !file ? "#94a3b8" : "white",
                border: "none",
                borderRadius: 8,
                cursor: loading || !file ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 14,
                whiteSpace: "nowrap",
                boxShadow: loading || !file ? "none" : "0 4px 12px rgba(99,102,241,0.35)"
              }}
            >
              {loading ? "⏳ Uploading..." : "Upload & Analyze"}
            </button>
          </form>

          {uploadMsg && (
            <div style={{
              marginTop: 12,
              padding: "10px 16px",
              background: isError ? "#fef2f2" : "#f0fdf4",
              border: `1px solid ${isError ? "#fecaca" : "#bbf7d0"}`,
              borderRadius: 8,
              color: isError ? "#dc2626" : "#16a34a",
              fontSize: 14,
              fontWeight: 500
            }}>
              {isError ? "❌" : "✅"} {uploadMsg}
            </div>
          )}
        </div>

        {/* Stat Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 28
        }}>

          {/* Churn */}
          <div style={{
            background: "white", borderRadius: 16, padding: 28,
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            border: "1px solid #f1f5f9",
            borderTop: `4px solid ${churnColor}`
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
              Churn Risk Score
            </div>
            <div style={{ fontSize: 52, fontWeight: 900, color: churnColor, lineHeight: 1, marginBottom: 8 }}>
              {churn?.score ?? "—"}<span style={{ fontSize: 28 }}>%</span>
            </div>
            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 16, marginBottom: 6 }}>
              {churn?.label ?? "No data yet"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              {churn?.reason ?? "Upload data to calculate"}
            </div>
          </div>

          {/* Fatigue */}
          <div style={{
            background: "white", borderRadius: 16, padding: 28,
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            border: "1px solid #f1f5f9",
            borderTop: `4px solid ${fatigue?.fatigue_detected ? "#ef4444" : "#22c55e"}`
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
              Content Fatigue
            </div>
            <div style={{ fontSize: 40, marginBottom: 8 }}>
              {fatigue?.fatigue_detected ? "⚠️" : "✅"}
            </div>
            <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 20, marginBottom: 6 }}>
              {fatigue?.fatigue_detected ? "Fatigue Detected" : "Healthy"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
              {fatigue?.message ?? "Upload data to check fatigue"}
            </div>
          </div>

          {/* Forecast */}
          <div style={{
            background: "white", borderRadius: 16, padding: 28,
            boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            border: "1px solid #f1f5f9",
            borderTop: "4px solid #6366f1"
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
              Engagement Forecast
            </div>
            {forecast.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {forecast.map((v, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 12px", background: "#f8fafc", borderRadius: 8, fontSize: 14
                  }}>
                    <span style={{ color: "#64748b", fontWeight: 500 }}>Period +{i + 1}</span>
                    <span style={{ fontWeight: 800, color: "#6366f1", fontSize: 16 }}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📈</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Upload data to see forecast</div>
              </div>
            )}
          </div>
        </div>

        {/* Chart */}
        <div style={{
          background: "white", borderRadius: 16, padding: "28px 32px",
          boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
          border: "1px solid #f1f5f9"
        }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: "#1e293b" }}>
              Engagement Retention Trend
            </div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
              Engagement score over time with rolling average
            </div>
          </div>
          {retention.length > 0 ? (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={retention} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="post_date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{
                  borderRadius: 10, border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
                }} />
                <Legend />
                <Line type="monotone" dataKey="engagement_score"
                  stroke="#6366f1" strokeWidth={3} dot={false} name="Engagement Score" />
                <Line type="monotone" dataKey="rolling_engagement"
                  stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Rolling Average" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div style={{
              height: 360, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", color: "#94a3b8"
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "#475569" }}>No data yet</div>
              <div style={{ fontSize: 14 }}>Upload a CSV file above to see your retention trend</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center", padding: "20px",
        color: "#94a3b8", fontSize: 13,
        borderTop: "1px solid #e2e8f0",
        background: "white"
      }}>
        Creator Audience Pulse — Built with FastAPI + React
      </div>
    </div>
  );
}