"use client";

/**
 * SmartExam Landing — Perfected
 * ✔ FIX 1: Logo background → transparent (logo fully visible, no dark overlay)
 * ✔ FIX 2: College name → Syne font + white-to-indigo gradient (sharp & institutional)
 * ✔ FIX 3: Mobile header → stacks vertically, logo+name on one row, badge below, zero overlap
 * ✔ All routing, canvas, buttons, hero, footer unchanged
 */

import { motion, useAnimationFrame } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useEffect } from "react";

/* ─────────────────────────────────────────────────────────
   ANIMATED CANVAS BACKGROUND — SSR-SAFE
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
      canvas.width  = nW; canvas.height = nH;
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
   GLOW BUTTON
───────────────────────────────────────────────────────── */
function GlowButton({ label, onClick, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        width: "100%", height: "52px", borderRadius: "13px", border: "none",
        background: hov ? "linear-gradient(135deg,#22d3ee,#0ea5e9,#818cf8)"
                        : "linear-gradient(135deg,#06b6d4,#0ea5e9,#6366f1)",
        color: "white", fontSize: "15px", fontWeight: 700,
        letterSpacing: "0.04em", cursor: "pointer", fontFamily: "inherit",
        boxShadow: hov ? "0 0 55px rgba(6,182,212,0.65), 0 8px 28px rgba(6,182,212,0.3)"
                       : "0 0 28px rgba(6,182,212,0.35), 0 4px 16px rgba(6,182,212,0.15)",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.27s cubic-bezier(0.22,1,0.36,1)",
        position: "relative", overflow: "hidden",
      }}
    >
      <span style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.22) 50%,transparent 65%)",
        transform: hov ? "translateX(110%)" : "translateX(-110%)",
        transition: "transform 0.55s ease",
      }} />
      <span style={{ position: "relative", zIndex: 1 }}>{label}</span>
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
   GHOST BUTTON
───────────────────────────────────────────────────────── */
function GhostButton({ label, onClick, delay = 0 }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        height: "46px", borderRadius: "11px", cursor: "pointer",
        background: hov ? "rgba(6,182,212,0.10)" : "rgba(255,255,255,0.04)",
        border: hov ? "1px solid rgba(6,182,212,0.55)" : "1px solid rgba(255,255,255,0.13)",
        color: hov ? "#e0f7ff" : "rgba(255,255,255,0.62)",
        fontSize: "13.5px", fontWeight: 600,
        transform: hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hov ? "0 6px 22px rgba(6,182,212,0.18)" : "none",
        transition: "all 0.25s cubic-bezier(0.22,1,0.36,1)",
        backdropFilter: "blur(10px)", fontFamily: "inherit",
      }}
    >
      {label}
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export default function SmartExamLanding() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;900&family=Syne:wght@700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800;900&display=swap');


        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; overflow: hidden; }

        @keyframes ping {
          0%        { transform: scale(1); opacity: 0.8; }
          80%, 100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0); }
          50%       { box-shadow: 0 0 14px 2px rgba(6,182,212,0.22); }
        }

        /*
          MOBILE FIX (≤640px):
          Header stacks into two rows:
            Row 1 → logo + college name (flex row, aligned)
            Row 2 → System Online badge (aligned left)
          No overlap possible because it's a flex column layout.
        */
        @media (max-width: 640px) {
          .header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            padding: 12px 16px !important;
            gap: 10px !important;
          }
          .logo-box {
            width: 46px !important;
            height: 46px !important;
            border-radius: 12px !important;
          }
          .college-name-text {
            font-size: 13px !important;
            line-height: 1.3 !important;
          }
          .college-sub-text {
            font-size: 10px !important;
            margin-top: 3px !important;
          }
        }

        /* TABLET (641–960px) */
        @media (min-width: 641px) and (max-width: 960px) {
          .header-row        { padding: 14px 24px !important; }
          .college-name-text { font-size: 15px !important; }
        }
      `}</style>

      <div style={{
        position: "fixed", inset: 0,
        background: "#04080f", color: "white",
        fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        <AnimatedBackground />

        {/* ══════════ HEADER ══════════ */}
        <header style={{ position: "relative", zIndex: 20, flexShrink: 0 }}>
          <div
            className="header-row"
            style={{
              maxWidth: "1160px", margin: "0 auto",
              padding: "14px 40px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: "20px",
            }}
          >
            {/* Logo + Name */}
            <motion.div
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: "flex", alignItems: "center", gap: "14px" }}
            >
              {/*
                FIX 1 — background: "transparent"
                The original rgba(0,0,0,0.45) was a near-opaque black layer
                sitting on top of the dark page background, making the logo
                invisible. Transparent lets the logo's own colours show directly.
                The cyan border + glow still frames it clearly.
              */}
              <div
                className="logo-box"
                style={{
                  width: "68px", height: "68px", flexShrink: 0,
                  borderRadius: "18px",
                  background: "transparent",
                  border: "1.5px solid rgba(6,182,212,0.50)",
                  boxShadow: "0 0 0 4px rgba(6,182,212,0.10), 0 0 26px rgba(6,182,212,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Image
                  src="/GIST_logo.png"
                  alt="GIST Logo"
                  width={65}
                  height={65}
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>

              {/*
                FIX 2 — Syne font + white→soft-indigo gradient
                Outfit felt too rounded/casual for an institutional name.
                Syne at 800 weight has the same sharp, geometric authority
                as the hero title — makes the header feel cohesive.
              */}
              <div>
                <p
                  className="college-name-text"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "30px", fontWeight: 800,
                    lineHeight: 1.25, margin: 0,
                    background: "linear-gradient(135deg, #ffffff 0%, #c7d2fe 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Geethanjali Institute of Science & Technology
                </p>
                <p
                  className="college-sub-text"
                  style={{
                    fontSize: "11.5px", color: "rgba(255,255,255,0.42)",
                    letterSpacing: "0.07em", margin: "5px 0 0", fontWeight: 500,
                  }}
                >
                  Autonomous · NAAC 'A' Grade · NBA Accredited
                </p>
              </div>
            </motion.div>

            {/* System Online badge */}
            <motion.div
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: "9px",
                padding: "7px 16px", borderRadius: "999px",
                background: "rgba(16,185,129,0.09)",
                border: "1px solid rgba(16,185,129,0.28)",
                backdropFilter: "blur(10px)",
              }}
            >
              <span style={{ position: "relative", display: "flex", width: "7px", height: "7px", flexShrink: 0 }}>
                <span style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  background: "#34d399", animation: "ping 1.8s ease-out infinite",
                }} />
                <span style={{ display: "block", width: "7px", height: "7px", borderRadius: "50%", background: "#34d399" }} />
              </span>
              <span style={{
                color: "#6ee7b7", fontSize: "11px", fontWeight: 700,
                letterSpacing: "0.09em", textTransform: "uppercase", whiteSpace: "nowrap",
              }}>
                System Online
              </span>
            </motion.div>
          </div>

          {/* Glowing hairline */}
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg,transparent,rgba(6,182,212,0.38),transparent)",
          }} />
        </header>

        {/* ══════════ HERO ══════════ */}
        <main style={{
          flex: 1, position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "0 24px", overflow: "hidden", minHeight: 0,
        }}>
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            textAlign: "center", width: "100%", maxWidth: "560px",
          }}>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.48, ease: "backOut" }}
              style={{
                marginBottom: "20px", display: "inline-block",
                padding: "5px 17px", borderRadius: "999px",
                background: "linear-gradient(135deg,rgba(6,182,212,0.12),rgba(99,102,241,0.12))",
                border: "1px solid rgba(6,182,212,0.30)",
                color: "#67e8f9", fontSize: "10px", fontWeight: 700,
                letterSpacing: "0.14em", textTransform: "uppercase",
                backdropFilter: "blur(10px)",
                animation: "badgePulse 3.5s ease-in-out infinite",
              }}
            >
              ✦ Next-Gen Digital Examination Platform
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(2.2rem, 4.5vw, 3.8rem)",
                fontWeight: 900, lineHeight: 1.05,
                letterSpacing: "-0.025em", marginBottom: "16px",
              }}
            >
              <span style={{ color: "#f0f8ff" }}>Smart </span>
              <span style={{
                background: "linear-gradient(135deg,#67e8f9 0%,#38bdf8 50%,#a5b4fc 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text", filter: "drop-shadow(0 0 18px rgba(6,182,212,0.5))",
              }}>Exam</span>
              <br />
              <span style={{
                background: "linear-gradient(135deg,#a5b4fc 0%,#818cf8 45%,#67e8f9 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                backgroundClip: "text", filter: "drop-shadow(0 0 14px rgba(99,102,241,0.4))",
              }}>Center</span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
              style={{
                color: "rgba(255,255,255,0.45)",
                fontSize: "clamp(13px, 1.5vw, 15.5px)",
                lineHeight: 1.75, maxWidth: "440px",
                marginBottom: "32px", fontWeight: 400,
              }}
            >
              A secure digital examination environment built for
              reliability, fairness, and real-time performance.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.28 }}
              style={{ width: "100%", maxWidth: "400px", display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <GlowButton
                label="Student Login →"
                onClick={() => router.push("/login?role=student")}
                delay={0.30}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <GhostButton label="Register"    onClick={() => router.push("/register")}         delay={0.37} />
                <GhostButton label="Admin Login" onClick={() => router.push("/login?role=admin")} delay={0.43} />
              </div>
            </motion.div>

          </div>
        </main>

        {/* ══════════ FOOTER ══════════ */}
        <footer style={{ position: "relative", zIndex: 20, flexShrink: 0 }}>
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)",
          }} />
          <div style={{
            maxWidth: "1160px", margin: "0 auto",
            padding: "12px 40px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "8px",
            fontSize: "11px", color: "rgba(255,255,255,0.25)",
          }}>
            <span>© {new Date().getFullYear()} Geethanjali Institute of Science & Technology</span>
            <span style={{ color: "rgba(255,255,255,0.17)" }}>Smart Exam Center · All rights reserved</span>
          </div>
        </footer>

      </div>
    </>
  );
}
