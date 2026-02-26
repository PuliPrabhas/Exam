"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

/* ================= HELPERS ================= */

function safeParseJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function idToString(id) {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (id.toString) return id.toString();
  return String(id);
}

export default function TestPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [totalTimeLeft, setTotalTimeLeft] = useState(1800);
  const [loading, setLoading] = useState(true);

  const globalTimerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const submittedRef = useRef(false);
  

  /* ================= ELITE ANIMATIONS ================= */

  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.35, ease: "easeOut" },
    },
  };

  const optionVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.97 },
  };

  const paletteVariants = {
    idle: { scale: 1 },
    hover: { scale: 1.12 },
    tap: { scale: 0.9 },
  };

  /* ================= AUTH ================= */

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    const decoded = safeParseJwt(token);
    if (!decoded) router.push("/login");
  }, [router]);

  /* ================= FETCH ================= */

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/questions/list");
        const data = await res.json();

        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (Array.isArray(data.questions)) arr = data.questions;

        const normalized = arr.map((q) => ({
          ...q,
          _idStr: idToString(q._id),
          selectedOption: null,
          locked: false,
          timeLeft: 60,
        }));

        setQuestions(normalized);
        if (normalized.length) setActiveQuestionId(normalized[0]._idStr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ================= GLOBAL TIMER (SAFE) ================= */

  useEffect(() => {
    if (submittedRef.current) return;

    globalTimerRef.current = setInterval(() => {
      setTotalTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(globalTimerRef.current);
          setTimeout(() => handleSubmit(), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(globalTimerRef.current);
  }, []);

  /* ================= QUESTION TIMER ================= */

  useEffect(() => {
    if (!activeQuestionId) return;

    clearInterval(questionTimerRef.current);

    questionTimerRef.current = setInterval(() => {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q._idStr === activeQuestionId && !q.locked) {
            if (q.timeLeft <= 1) {
              return { ...q, timeLeft: 0, locked: true };
            }
            return { ...q, timeLeft: q.timeLeft - 1 };
          }
          return q;
        })
      );
    }, 1000);

    return () => clearInterval(questionTimerRef.current);
  }, [activeQuestionId]);

  /* ================= ANTI CHEAT ================= */

  useEffect(() => {
    const prevent = (e) => e.preventDefault();

    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);

    const handleVisibility = () => {
      if (document.hidden) setTimeout(() => handleSubmit(), 0);
    };

    const handleBlur = () => setTimeout(() => handleSubmit(), 0);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  /* ================= SELECT ================= */

  const selectOption = (qid, opt) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._idStr === qid && !q.locked
          ? { ...q, selectedOption: opt }
          : q
      )
    );
  };

  /* ================= SUBMIT (FINAL SAFE) ================= */

  const handleSubmit = () => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    clearInterval(globalTimerRef.current);
    clearInterval(questionTimerRef.current);

    const total = questions.length;
    const correct = questions.filter(
      (q) => q.selectedOption === q.correctAnswer
    ).length;

    const attempted = questions.filter((q) => q.selectedOption).length;
    const wrong = attempted - correct;
    const locked = questions.filter((q) => q.locked).length;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;

    sessionStorage.setItem(
      "examResult",
      JSON.stringify({
        total,
        correct,
        wrong,
        attempted,
        locked,
        percent,
      })
    );

    setTimeout(() => router.push("/result"), 120);
  };

  /* ================= COUNTS ================= */

  const answeredCount = questions.filter(
    (q) => q.selectedOption && !q.locked
  ).length;

  const lockedCount = questions.filter((q) => q.locked).length;

  const unansweredCount =
    questions.length - answeredCount - lockedCount;

  const getColor = (q) => {
    if (q.locked) return "bg-red-600";
    if (q.selectedOption) return "bg-green-600";
    if (q._idStr === activeQuestionId) return "bg-blue-600";
    return "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading exam...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-[#070b14] text-white flex flex-col lg:flex-row select-none"
    >
      {/* ================= LEFT ================= */}
      <div className="w-full lg:w-3/4 p-6 lg:p-8 overflow-y-auto space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-10 backdrop-blur-xl bg-[#070b14]/70 pb-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl lg:text-2xl font-semibold">
              Technical Assessment
            </h1>

            <motion.div
              animate={
                totalTimeLeft <= 60
                  ? { scale: [1, 1.08, 1] }
                  : { scale: 1 }
              }
              transition={{
                repeat: totalTimeLeft <= 60 ? Infinity : 0,
                duration: 1.2,
              }}
              className="text-yellow-400 font-semibold"
            >
              ⏱ {Math.floor(totalTimeLeft / 60)}m {totalTimeLeft % 60}s
            </motion.div>
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, i) => (
          <motion.div
            key={q._idStr}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ y: -6 }}
            onMouseEnter={() => setActiveQuestionId(q._idStr)}
            className={`group relative p-5 lg:p-6 rounded-2xl border border-white/10 
              bg-gradient-to-br from-[#0f172a] to-[#020617]
              shadow-[0_10px_30px_rgba(0,0,0,0.4)]
              ${q.locked ? "opacity-60" : ""}`}
          >
            <h2 className="text-base lg:text-lg font-medium mb-2">
              Q{i + 1}. {q.question}
            </h2>

            <p className="text-xs text-yellow-400 mb-4">
              Time left: {q.timeLeft}s {q.locked && "🔒"}
            </p>

            <div className="space-y-2">
              {["A", "B", "C", "D"].map((opt) => (
                <motion.label
                  key={opt}
                  variants={optionVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  className={`block p-3 rounded-xl cursor-pointer transition-all duration-200
                    ${
                      q.selectedOption === opt
                        ? "bg-blue-500/20 border border-blue-400/40 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                >
                  <input
                    type="radio"
                    disabled={q.locked}
                    checked={q.selectedOption === opt}
                    onChange={() => selectOption(q._idStr, opt)}
                    className="mr-2 accent-blue-500"
                  />
                  <strong>{opt}.</strong> {q.options?.[opt]}
                </motion.label>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ================= RIGHT SIDEBAR ================= */}
      <div className="w-full lg:w-1/4 mt-6 lg:mt-0">
        <div className="lg:sticky lg:top-0 lg:h-screen flex flex-col bg-[#020617] border-l border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-semibold">Question Palette</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-5 gap-2 mb-6">
              {questions.map((q, idx) => (
                <motion.button
                  key={q._idStr}
                  variants={paletteVariants}
                  initial="idle"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setActiveQuestionId(q._idStr)}
                  className={`h-10 rounded-lg text-sm font-semibold ${getColor(
                    q
                  )} shadow-md`}
                >
                  {idx + 1}
                </motion.button>
              ))}
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-green-400">🟢 Answered: {answeredCount}</p>
              <p className="text-red-400">🔴 Locked: {lockedCount}</p>
              <p className="text-gray-300">⚪ Unanswered: {unansweredCount}</p>
            </div>
          </div>

          <div className="p-6 border-t border-white/10">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-semibold shadow-[0_10px_40px_rgba(16,185,129,0.35)]"
            >
              Submit Exam
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}