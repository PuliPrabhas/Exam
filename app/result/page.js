"use client";

/**
 * SmartExam Result Page
 * - Matches landing / login / register aesthetic exactly
 * - Same animated canvas, Syne + Outfit fonts, cyan palette
 * - All original session logic preserved untouched
 * - Animated score counter, performance badge, stat cards
 */

import { motion, useAnimationFrame } from "framer-motion";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────
   ANIMATED CANVAS BACKGROUND
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
      canvas.width = nW; canvas.height = nH;
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
   ANIMATED SCORE COUNTER
───────────────────────────────────────────────────────── */
function AnimatedNumber({ to, duration = 1400 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [to, duration]);
  return <>{val}</>;
}

/* ─────────────────────────────────────────────────────────
   PERFORMANCE BADGE — based on percent
───────────────────────────────────────────────────────── */
function PerformanceBadge({ percent }) {
  const { label, color, glow, emoji } =
    percent >= 90 ? { label: "Outstanding",  color: "#34d399", glow: "rgba(52,211,153,0.4)",  emoji: "🏆" } :
    percent >= 75 ? { label: "Excellent",    color: "#67e8f9", glow: "rgba(103,232,249,0.4)", emoji: "🌟" } :
    percent >= 60 ? { label: "Good",         color: "#a5b4fc", glow: "rgba(165,180,252,0.4)", emoji: "👍" } :
    percent >= 40 ? { label: "Average",      color: "#fbbf24", glow: "rgba(251,191,36,0.4)",  emoji: "📚" } :
                   { label: "Needs Work",    color: "#f87171", glow: "rgba(248,113,113,0.4)", emoji: "💪" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.5, ease: "backOut" }}
      style={{
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "6px 18px", borderRadius: "999px",
        border: `1px solid ${color}55`,
        background: `${color}15`,
        boxShadow: `0 0 20px ${glow}`,
        fontSize: "13px", fontWeight: 700,
        color, letterSpacing: "0.06em",
      }}
    >
      <span>{emoji}</span>
      <span style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   CIRCULAR SCORE RING
───────────────────────────────────────────────────────── */
function ScoreRing({ percent }) {
  const r   = 54;
  const circ = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circ);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circ - (percent / 100) * circ);
    }, 300);
    return () => clearTimeout(timer);
  }, [percent, circ]);

  const color =
    percent >= 75 ? "#34d399" :
    percent >= 50 ? "#67e8f9" :
    percent >= 35 ? "#fbbf24" : "#f87171";

  return (
    <div style={{ position: "relative", width: "140px", height: "140px", flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="70" cy="70" r={r} fill="none"
          stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        {/* Progress */}
        <circle cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "28px", fontWeight: 900,
          color, lineHeight: 1,
          filter: `drop-shadow(0 0 10px ${color})`,
        }}>
          <AnimatedNumber to={percent} />%
        </span>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px", letterSpacing: "0.08em" }}>
          SCORE
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────── */
function StatCard({ label, value, color, icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: "20px", borderRadius: "16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.09)",
        display: "flex", flexDirection: "column", gap: "8px",
        transition: "all 0.25s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${color}55`;
        e.currentTarget.style.background  = `${color}0f`;
        e.currentTarget.style.transform   = "translateY(-3px)";
        e.currentTarget.style.boxShadow   = `0 8px 28px ${color}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
        e.currentTarget.style.background  = "rgba(255,255,255,0.03)";
        e.currentTarget.style.transform   = "translateY(0)";
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      <span style={{ fontSize: "20px" }}>{icon}</span>
      <span style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: "32px", fontWeight: 900, lineHeight: 1, color,
        filter: `drop-shadow(0 0 8px ${color}88)`,
      }}>
        <AnimatedNumber to={value} duration={900} />
      </span>
      <span style={{
        fontSize: "11px", color: "rgba(255,255,255,0.40)",
        fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase",
      }}>
        {label}
      </span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function ResultPage() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── Original session logic — untouched ── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("examAttempt");
      if (!raw) { setAttempt(null); setLoading(false); return; }
      const parsed = JSON.parse(raw);
      const normalized = {
        studentName: parsed.studentName ?? "Unknown",
        total:       Number(parsed.total       ?? 0),
        correct:     Number(parsed.correct     ?? 0),
        wrong:       Number(parsed.wrong       ?? 0),
        attempted:   Number(parsed.attempted   ?? 0),
        percent:     Number(parsed.percent     ?? 0),
      };
      setAttempt(normalized);
    } catch (err) {
      console.error("Result parse error:", err);
      setAttempt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const sharedWrapper = (children) => (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;900&family=Syne:wght@700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={{
        minHeight: "100vh", background: "#04080f",
        color: "white", fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        position: "relative",
      }}>
        <AnimatedBackground />
        {children}
      </div>
    </>
  );

  /* ── Loading ── */
  if (loading) return sharedWrapper(
    <div style={{
      position: "fixed", inset: 0, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: "16px",
    }}>
      <span style={{
        width: "36px", height: "36px", borderRadius: "50%",
        border: "3px solid rgba(255,255,255,0.1)",
        borderTopColor: "#06b6d4",
        animation: "spin 0.8s linear infinite",
        display: "inline-block",
      }} />
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Loading result…</p>
    </div>
  );

  /* ── No result ── */
  if (!attempt) return sharedWrapper(
    <div style={{
      position: "fixed", inset: 0, zIndex: 10,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: "center", maxWidth: "360px", padding: "48px 36px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "24px", backdropFilter: "blur(20px)",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "22px", fontWeight: 900, marginBottom: "10px",
          background: "linear-gradient(135deg,#f0f8ff,#a5b4fc)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          No Result Found
        </h2>
        <p style={{ color: "rgba(255,255,255,0.40)", fontSize: "14px", lineHeight: 1.6, marginBottom: "24px" }}>
          Please complete an exam first to view your results here.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "10px 28px", borderRadius: "11px", border: "none",
            background: "linear-gradient(135deg,#06b6d4,#6366f1)",
            color: "white", fontSize: "14px", fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 0 24px rgba(6,182,212,0.3)",
          }}
        >
          Go to Dashboard
        </button>
      </motion.div>
    </div>
  );

  /* ── Result UI ── */
  return sharedWrapper(
    <div style={{
      position: "relative", zIndex: 10,
      maxWidth: "780px", margin: "0 auto",
      padding: "48px 24px 64px",
    }}>

      {/* Page heading */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: "36px" }}
      >
        <p style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "0.14em",
          textTransform: "uppercase", color: "#67e8f9", marginBottom: "8px",
        }}>
          ✦ Smart Exam Center
        </p>
        <h1 style={{
          fontFamily: "sans-serif",
          fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
          fontWeight: 900, letterSpacing: "-0.02em",
          background: "linear-gradient(135deg,#f0f8ff 0%,#a5b4fc 100%)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          backgroundClip: "text", margin: 0,
        }}>
          Exam Result
        </h1>
      </motion.div>

      {/* Student + Score row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55 }}
        style={{
          display: "flex", alignItems: "center",
          gap: "24px", flexWrap: "wrap",
          padding: "28px", borderRadius: "20px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          backdropFilter: "blur(14px)",
          marginBottom: "20px",
          boxShadow: "0 0 60px rgba(6,182,212,0.06)",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Top glow line */}
        <div style={{
          position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
          background: "linear-gradient(90deg,transparent,rgba(6,182,212,0.55),transparent)",
        }} />

        {/* Score ring */}
        <ScoreRing percent={attempt.percent} />

        {/* Student info + badge */}
        <div style={{ flex: 1, minWidth: "180px" }}>
          <p style={{
            fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.38)",
            marginBottom: "6px",
          }}>
            Student
          </p>
          <p style={{
            fontFamily: "sans-serif",
            fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
            fontWeight: 800, color: "rgba(255,255,255,0.95)",
            marginBottom: "14px", lineHeight: 1.2,
          }}>
            {attempt.studentName}
          </p>
          <PerformanceBadge percent={attempt.percent} />
        </div>
      </motion.div>

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "14px", marginBottom: "32px",
      }}>
        <StatCard label="Total Questions" value={attempt.total}     color="#67e8f9" icon="📝" delay={0.30} />
        <StatCard label="Correct"         value={attempt.correct}   color="#34d399" icon="✅" delay={0.37} />
        <StatCard label="Wrong"           value={attempt.wrong}     color="#f87171" icon="❌" delay={0.44} />
        <StatCard label="Attempted"       value={attempt.attempted} color="#a5b4fc" icon="🎯" delay={0.51} />
      </div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.60, duration: 0.5 }}
        style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            height: "48px", padding: "0 28px", borderRadius: "12px", border: "none",
            background: "linear-gradient(135deg,#06b6d4,#0ea5e9,#6366f1)",
            color: "white", fontSize: "14px", fontWeight: 700,
            cursor: "pointer", fontFamily: "inherit",
            boxShadow: "0 0 24px rgba(6,182,212,0.3)",
            transition: "all 0.25s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(6,182,212,0.5)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 0 24px rgba(6,182,212,0.3)"; }}
        >
          ← Back to Dashboard
        </button>
      </motion.div>

    </div>
  );
}
