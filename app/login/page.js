"use client";

/**
 * SmartExam Login Page
 * - Matches landing page aesthetic exactly (same bg, fonts, orbs, grid)
 * - Reads ?role=student|admin from URL and pre-selects the tab
 * - All existing API logic preserved untouched
 * - SSR-safe canvas background
 */

import { motion, useAnimationFrame } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useEffect, Suspense } from "react";

/* ─────────────────────────────────────────────────────────
   ANIMATED CANVAS BACKGROUND — identical to landing page
───────────────────────────────────────────────────────── */
function AnimatedBackground() {
  const canvasRef = useRef(null);
  const stateRef  = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    const min = Math.min(W, H);

    stateRef.current = {
      W, H,
      orbs: [
        { x: W * 0.12, y: H * 0.18, r: min * 0.52, color: "6,182,212",  vx:  0.20, vy:  0.13 },
        { x: W * 0.82, y: H * 0.62, r: min * 0.46, color: "99,102,241", vx: -0.15, vy:  0.19 },
        { x: W * 0.50, y: H * 0.92, r: min * 0.38, color: "20,184,166", vx:  0.11, vy: -0.16 },
        { x: W * 0.90, y: H * 0.08, r: min * 0.28, color: "139,92,246", vx: -0.13, vy:  0.11 },
      ],
      particles: Array.from({ length: 90 }, () => ({
        x:     Math.random() * W,
        y:     Math.random() * H,
        size:  Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.5 + 0.1,
        vx:    (Math.random() - 0.5) * 0.25,
        vy:    (Math.random() - 0.5) * 0.25,
      })),
    };

    const onResize = () => {
      const nW = window.innerWidth;
      const nH = window.innerHeight;
      canvas.width  = nW;
      canvas.height = nH;
      if (stateRef.current) { stateRef.current.W = nW; stateRef.current.H = nH; }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useAnimationFrame(() => {
    const s = stateRef.current;
    const canvas = canvasRef.current;
    if (!s || !canvas) return;
    const ctx = canvas.getContext("2d");
    const { W, H, orbs, particles } = s;
    ctx.clearRect(0, 0, W, H);

    orbs.forEach((o) => {
      o.x += o.vx; o.y += o.vy;
      if (o.x < -o.r * 0.4 || o.x > W + o.r * 0.4) o.vx *= -1;
      if (o.y < -o.r * 0.4 || o.y > H + o.r * 0.4) o.vy *= -1;
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0,   `rgba(${o.color},0.20)`);
      g.addColorStop(0.5, `rgba(${o.color},0.07)`);
      g.addColorStop(1,   `rgba(${o.color},0)`);
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill();
    });

    ctx.strokeStyle = "rgba(34,211,238,0.038)"; ctx.lineWidth = 0.6;
    for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 64) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    particles.forEach((p) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(103,232,249,${p.alpha})`; ctx.fill();
    });
  });

  return (
    <canvas ref={canvasRef} style={{
      position: "fixed", inset: 0, width: "100vw", height: "100vh",
      pointerEvents: "none", zIndex: 0,
    }} />
  );
}

/* ─────────────────────────────────────────────────────────
   INNER LOGIN — reads searchParams (must be inside Suspense)
───────────────────────────────────────────────────────── */
function LoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [role,     setRole]     = useState("student");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showPass, setShowPass] = useState(false);

  // Read ?role= from URL on mount
  useEffect(() => {
    const r = searchParams.get("role");
    if (r === "admin" || r === "student") setRole(r);
  }, [searchParams]);

  // ── Original API logic — untouched ──
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        router.push(role === "admin" ? "/admin" : "/dashboard");
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = role === "admin";

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#04080f", color: "white",
      fontFamily: "'Outfit', 'Segoe UI', sans-serif",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "24px",
    }}>
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative", zIndex: 10,
          width: "100%", maxWidth: "420px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "24px",
          padding: "36px 36px 32px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 0 80px rgba(6,182,212,0.08), 0 24px 60px rgba(0,0,0,0.5)",
        }}
      >

        {/* Top glow line */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
          background: "linear-gradient(90deg,transparent,rgba(6,182,212,0.6),transparent)",
          borderRadius: "999px",
        }} />

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45 }}
          style={{ textAlign: "center", marginBottom: "28px" }}
        >
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "26px", fontWeight: 900,
            letterSpacing: "-0.02em", margin: "0 0 6px",
            background: "linear-gradient(135deg,#f0f8ff,#a5b4fc)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.38)", margin: 0 }}>
            Smart Exam Center · Sign in to continue
          </p>
        </motion.div>

        {/* ── ROLE TAB SWITCHER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: "6px", marginBottom: "24px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "12px", padding: "5px",
          }}
        >
          {["student", "admin"].map((r) => {
            const active = role === r;
            return (
              <button
                key={r}
                onClick={() => setRole(r)}
                style={{
                  height: "38px", borderRadius: "9px", border: "none",
                  cursor: "pointer", fontSize: "13px", fontWeight: 700,
                  letterSpacing: "0.03em", fontFamily: "inherit",
                  transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
                  background: active
                    ? "linear-gradient(135deg,#06b6d4,#0ea5e9,#6366f1)"
                    : "transparent",
                  color: active ? "white" : "rgba(255,255,255,0.40)",
                  boxShadow: active
                    ? "0 0 20px rgba(6,182,212,0.35), 0 2px 10px rgba(6,182,212,0.15)"
                    : "none",
                  transform: active ? "translateY(-1px)" : "none",
                }}
              >
                {r === "student" ? "🎓 Student" : "🛡️ Admin"}
              </button>
            );
          })}
        </motion.div>

        {/* ── FORM ── */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Email */}
          <InputField
            label="Email Address"
            type="email"
            placeholder={isAdmin ? "admin@gist.ac.in" : "student@gist.ac.in"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            delay={0.22}
            required
          />

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.45 }}
          >
            <label style={{
              display: "block", fontSize: "12px", fontWeight: 600,
              color: "rgba(255,255,255,0.50)", letterSpacing: "0.06em",
              textTransform: "uppercase", marginBottom: "8px",
            }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", height: "46px",
                  borderRadius: "11px", border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white", fontSize: "14px", fontFamily: "inherit",
                  padding: "0 44px 0 14px",
                  outline: "none", transition: "border-color 0.2s ease",
                  boxSizing: "border-box",
                }}
                onFocus={e  => e.target.style.borderColor = "rgba(6,182,212,0.55)"}
                onBlur={e   => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
              />
              {/* Show/hide toggle */}
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: "absolute", right: "12px", top: "50%",
                  transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(255,255,255,0.35)", fontSize: "15px", padding: 0,
                }}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </motion.div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "10px 14px", borderRadius: "10px",
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.30)",
                color: "#fca5a5", fontSize: "13px", fontWeight: 500,
              }}
            >
              ⚠ {error}
            </motion.div>
          )}

          {/* Submit */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.45 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={loading}
            style={{
              marginTop: "4px",
              width: "100%", height: "50px", borderRadius: "13px", border: "none",
              background: loading
                ? "rgba(6,182,212,0.3)"
                : "linear-gradient(135deg,#06b6d4,#0ea5e9,#6366f1)",
              color: "white", fontSize: "15px", fontWeight: 700,
              letterSpacing: "0.04em", cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              boxShadow: loading ? "none" : "0 0 28px rgba(6,182,212,0.35), 0 4px 16px rgba(6,182,212,0.15)",
              transition: "all 0.25s ease",
              position: "relative", overflow: "hidden",
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                <span style={{
                  width: "16px", height: "16px", borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  animation: "spin 0.7s linear infinite",
                  display: "inline-block",
                }} />
                Signing in…
              </span>
            ) : (
              `Sign in as ${isAdmin ? "Admin" : "Student"} →`
            )}
          </motion.button>

        </form>

        {/* Footer link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.42 }}
          style={{
            textAlign: "center", marginTop: "22px",
            fontSize: "13px", color: "rgba(255,255,255,0.35)",
          }}
        >
          Don't have an account?{" "}
          <span
            onClick={() => router.push("/register")}
            style={{
              color: "#67e8f9", cursor: "pointer", fontWeight: 600,
              borderBottom: "1px solid rgba(103,232,249,0.3)",
              paddingBottom: "1px", transition: "color 0.2s ease",
            }}
            onMouseEnter={e => e.target.style.color = "#a5f3fc"}
            onMouseLeave={e => e.target.style.color = "#67e8f9"}
          >
            Register here
          </span>
        </motion.p>

        {/* Back to home */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.46 }}
          style={{
            textAlign: "center", marginTop: "10px",
            fontSize: "12px", color: "rgba(255,255,255,0.22)",
          }}
        >
          <span
            onClick={() => router.push("/")}
            style={{ cursor: "pointer", transition: "color 0.2s" }}
            onMouseEnter={e => e.target.style.color = "rgba(255,255,255,0.55)"}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.22)"}
          >
            ← Back to home
          </span>
        </motion.p>

      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   REUSABLE INPUT FIELD
───────────────────────────────────────────────────────── */
function InputField({ label, type, placeholder, value, onChange, delay, required }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45 }}
    >
      <label style={{
        display: "block", fontSize: "12px", fontWeight: 600,
        color: "rgba(255,255,255,0.50)", letterSpacing: "0.06em",
        textTransform: "uppercase", marginBottom: "8px",
      }}>
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        style={{
          width: "100%", height: "46px",
          borderRadius: "11px", border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)",
          color: "white", fontSize: "14px", fontFamily: "inherit",
          padding: "0 14px", outline: "none",
          transition: "border-color 0.2s ease",
          boxSizing: "border-box",
        }}
        onFocus={e => e.target.style.borderColor = "rgba(6,182,212,0.55)"}
        onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.12)"}
      />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE EXPORT — wrapped in Suspense (required for useSearchParams)
───────────────────────────────────────────────────────── */
export default function LoginPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;900&family=Syne:wght@700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 100px #050a14 inset !important;
          -webkit-text-fill-color: white !important;
        }
        @keyframes ping {
          0%        { transform: scale(1); opacity: 0.8; }
          80%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Suspense fallback={null}>
        <LoginInner />
      </Suspense>
    </>
  );
}