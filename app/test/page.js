
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/* ================= CONFIG ================= */
const QUESTION_TIME = 60;
const TAB_LIMIT = 5;

/* ================= HELPERS ================= */
function safeParseJwt(token) {
  try {
    if (!token) return null;
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function idToString(id) {
  if (!id) return null;
  return typeof id === "string" ? id : id.toString();
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ================= COMPONENT ================= */
export default function TestPage() {
  const router = useRouter();

  /* ================= STATE ================= */
  const [questions, setQuestions] = useState([]);
  const questionsRef = useRef([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [globalTime, setGlobalTime] = useState(1800);
  const [loading, setLoading] = useState(true);
  const [noTest, setNoTest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [warning, setWarning] = useState("");

  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [activeTestInfo, setActiveTestInfo] = useState(null);

  /* ================= REFS ================= */
  const submittedRef = useRef(false);
  const globalTimerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const activeQuestionRef = useRef(null);
  const studentNameRef = useRef("");
  const storageKeyRef = useRef(null);

  /* ================= KEEP SNAPSHOT ================= */
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  /* ================= INIT ================= */
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        const decoded = safeParseJwt(token);
        if (!decoded) return router.replace("/login");

        const sid =
          decoded.id || decoded._id || decoded.sub || decoded.userId;
        const name =
          decoded.name || decoded.username || decoded.email || "";

        setStudentId(sid);
        setStudentName(name);
        studentNameRef.current = name;

        // check attempt
        const res = await fetch("/api/tests/attempt-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: sid }),
        });

        const data = await res.json();

        if (!data?.activeTest) return setNoTest(true);
        if (data.alreadyAttempted)
          return router.replace("/already-attempted");

        setActiveTestInfo(data.activeTest);

        // dynamic storage key (per student + test)
        const dynamicKey = `smart_exam_${sid}_${data.activeTest._id}`;
        storageKeyRef.current = dynamicKey;

        // restore if exists
        const saved = sessionStorage.getItem(dynamicKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setQuestions(parsed.questions || []);
          questionsRef.current = parsed.questions || [];
          setCurrentIndex(parsed.currentIndex || 0);
          setGlobalTime(parsed.globalTime || 1800);
          setTabSwitches(parsed.tabSwitches || 0);
          setLoading(false);
          return;
        }

        // fresh load
        const qres = await fetch(
          `/api/questions/list?testId=${data.activeTest._id}`
        );
        const qdata = await qres.json();

        const arr = Array.isArray(qdata)
          ? qdata
          : qdata.questions || qdata.data || [];

        const normalized = arr.map((q) => ({
          ...q,
          _idStr: idToString(q._id),
          selectedOption: null,
          timeLeft: QUESTION_TIME,
          locked: false,
        }));

        setQuestions(normalized);

        if (data.activeTest?.duration) {
          setGlobalTime(Number(data.activeTest.duration) * 60);
        }
      } catch (e) {
        console.error("Init error:", e);
        setNoTest(true);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  /* ================= PERSIST STATE ================= */
  useEffect(() => {
    if (!storageKeyRef.current || !questions.length) return;

    const examState = {
      questions,
      currentIndex,
      globalTime,
      tabSwitches,
    };

    sessionStorage.setItem(
      storageKeyRef.current,
      JSON.stringify(examState)
    );
  }, [questions, currentIndex, globalTime, tabSwitches]);

  /* ================= SAFE SUBMIT ================= */
  const safeSubmit = async (reason = "manual") => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    clearInterval(globalTimerRef.current);
    clearInterval(questionTimerRef.current);

    const snapshot = questionsRef.current;

    const total = snapshot.length;
    const correct = snapshot.filter(
      (q) => q.selectedOption === q.correctAnswer
    ).length;
    const attempted = snapshot.filter((q) => q.selectedOption).length;
    const wrong = attempted - correct;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    const payload = {
      studentId,
      studentName: studentNameRef.current || "Student",
      testId: activeTestInfo?._id,
      total,
      correct,
      wrong,
      attempted,
      percent,
      reason,
      answers: snapshot,
      createdAt: new Date().toISOString(),
    };

    // ⭐ CRITICAL for ResultPage
    sessionStorage.setItem("examAttempt", JSON.stringify(payload));

    // cleanup resume state ONLY for this user/test
    if (storageKeyRef.current) {
      sessionStorage.removeItem(storageKeyRef.current);
    }

    try {
      await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Submit failed:", err);
    }

    router.replace("/result");
  };

  /* ================= GLOBAL TIMER ================= */
  useEffect(() => {
    if (loading || noTest) return;

    globalTimerRef.current = setInterval(() => {
      setGlobalTime((t) => {
        if (t <= 1) {
          safeSubmit("time_up");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(globalTimerRef.current);
  }, [loading, noTest]);

  /* ================= PER QUESTION TIMER ================= */
  useEffect(() => {
    const q = questions[currentIndex];
    if (!q) return;

    clearInterval(questionTimerRef.current);
    activeQuestionRef.current = q._idStr;

    questionTimerRef.current = setInterval(() => {
      setQuestions((prev) =>
        prev.map((item) => {
          if (item._idStr !== activeQuestionRef.current) return item;
          if (item.locked) return item;

          if (item.timeLeft <= 1) {
            return { ...item, timeLeft: 0, locked: true };
          }

          return { ...item, timeLeft: item.timeLeft - 1 };
        })
      );
    }, 1000);

    return () => clearInterval(questionTimerRef.current);
  }, [currentIndex, questions.length]);

  /* ================= PROCTOR ================= */
  useEffect(() => {
    const prevent = (e) => e.preventDefault();

    document.addEventListener("copy", prevent);
    document.addEventListener("paste", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("selectstart", prevent);

    const handleVisibility = () => {
      if (document.hidden && !submittedRef.current) {
        setTabSwitches((c) => {
          const next = c + 1;
          setWarning(`⚠ Tab switch detected (${next}/${TAB_LIMIT})`);

          if (next >= TAB_LIMIT) {
            setTimeout(() => safeSubmit("tab_switch_limit"), 1200);
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleVisibility);

    return () => {
      document.removeEventListener("copy", prevent);
      document.removeEventListener("paste", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("selectstart", prevent);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleVisibility);
    };
  }, []);

  /* ================= SELECT ================= */
  const selectOption = (opt) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const cur = copy[currentIndex];
      if (cur.locked) return prev;
      copy[currentIndex] = { ...cur, selectedOption: opt };
      return copy;
    });
  };

  /* ================= DERIVED ================= */
  const answered = useMemo(
    () => questions.filter((q) => q.selectedOption).length,
    [questions]
  );

  const locked = useMemo(
    () => questions.filter((q) => q.locked).length,
    [questions]
  );

  const remaining = useMemo(
    () => questions.filter((q) => !q.selectedOption && !q.locked).length,
    [questions]
  );

  const q = questions[currentIndex];

  /* ================= GUARDS ================= */
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading exam...
      </div>
    );

  if (noTest)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        No tests available right now
      </div>
    );

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      {warning && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed top-0 left-0 w-full z-50"
        >
          <div className="bg-red-600 text-white text-center py-3 text-sm font-medium shadow-lg">
            {warning}
          </div>
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto p-6 grid lg:grid-cols-[1fr_340px] gap-8">
        {/* LEFT */}
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">
              Technical Assessment
            </h1>
            <div className="text-yellow-400 font-bold">
              ⏱ {formatTime(globalTime)}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {q && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-8 rounded-2xl bg-[#0f172a] border border-white/10"
              >
                <div className="flex justify-between mb-6">
                  <h2 className="font-medium text-lg">
                    Q{currentIndex + 1}. {q.question}
                  </h2>
                  <span className="text-yellow-400 font-semibold">
                    {q.locked ? "🔒 Locked" : `⏳ ${q.timeLeft}s`}
                  </span>
                </div>

                <div className="space-y-4">
                  {["A", "B", "C", "D"].map((opt) => {
                    const selected = q.selectedOption === opt;
                    return (
                      <motion.label
                        key={opt}
                        whileHover={!q.locked ? { scale: 1.02 } : {}}
                        whileTap={!q.locked ? { scale: 0.97 } : {}}
                        className={`block p-4 rounded-xl cursor-pointer transition-all
                          ${
                            selected
                              ? "bg-emerald-600"
                              : "bg-white/5 hover:bg-white/10"
                          }
                          ${q.locked ? "opacity-60 cursor-not-allowed" : ""}
                        `}
                      >
                        <input
                          type="radio"
                          disabled={q.locked}
                          checked={selected}
                          onChange={() => selectOption(opt)}
                          className="mr-2 cursor-pointer"
                        />
                        <strong>{opt}.</strong> {q.options?.[opt]}
                      </motion.label>
                    );
                  })}
                </div>

                <div className="mt-10 pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between gap-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((i) => i - 1)}
                      className="min-w-[120px] px-6 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200 disabled:opacity-40 font-medium shadow-md cursor-pointer"
                    >
                      Previous
                    </motion.button>

                    {currentIndex === questions.length - 1 ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={submitting}
                        onClick={() => safeSubmit("manual")}
                        className="min-w-[140px] px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-all duration-200 font-semibold shadow-lg cursor-pointer"
                      >
                        Submit
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setCurrentIndex((i) => i + 1)}
                        className="min-w-[120px] px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all duration-200 font-semibold shadow-lg cursor-pointer"
                      >
                        Next
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT PALETTE */}
        <div className="lg:sticky lg:top-6 h-fit p-6 rounded-2xl bg-[#020617] border border-white/10 shadow-xl space-y-6">
          <h3 className="font-semibold text-lg">Question Palette</h3>

          <div className="grid grid-cols-5 gap-3">
            {questions.map((item, i) => (
              <button
                key={item._idStr}
                onClick={() => setCurrentIndex(i)}
                className={`h-11 rounded-lg font-semibold transition-all active:scale-95 cursor-pointer
                  ${
                    item.locked
                      ? "bg-red-600"
                      : item.selectedOption
                      ? "bg-emerald-600"
                      : i === currentIndex
                      ? "bg-blue-600 ring-2 ring-blue-400/40"
                      : "bg-gray-600 hover:bg-gray-500"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3 text-sm">
            <div className="flex justify-between text-green-400">
              <span>Answered</span>
              <span>{answered}</span>
            </div>
            <div className="flex justify-between text-red-400">
              <span>Locked</span>
              <span>{locked}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Remaining</span>
              <span>{remaining}</span>
            </div>
          </div>

          <button
            onClick={() => safeSubmit("manual")}
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 transition py-3 rounded-xl font-semibold shadow-lg active:scale-95 cursor-pointer"
          >
            Submit Exam
          </button>
        </div>
      </div>
    </div>
  );
}
