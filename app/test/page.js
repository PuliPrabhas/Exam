"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

/* ================= HELPERS ================= */
function safeParseJwt(token) {
  try {
    if (!token) return null;
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
  if (id?.toString) return id.toString();
  return String(id);
}

/* ================= COMPONENT ================= */
export default function TestPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalTimeLeft, setTotalTimeLeft] = useState(1800);
  const [loading, setLoading] = useState(true);
  const [noTestAvailable, setNoTestAvailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState("Student");
  const [activeTestInfo, setActiveTestInfo] = useState(null);

  const submittedRef = useRef(false);
  const timerRef = useRef(null);

  /* ================= INIT ================= */
  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem("token");
        const decoded = safeParseJwt(token);

        if (!decoded) {
          router.replace("/login");
          return;
        }

        const sid =
          decoded.id ||
          decoded._id ||
          decoded.sub ||
          decoded.userId ||
          null;

        const sname =
          decoded.name ||
          decoded.username ||
          decoded.email ||
          "Student";

        setStudentId(sid);
        setStudentName(sname);

        // ✅ attempt check
        const res = await fetch("/api/tests/attempt-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: sid }),
        });

        if (!res.ok) {
          setNoTestAvailable(true);
          return;
        }

        const data = await res.json();

        if (!data?.activeTest) {
          setNoTestAvailable(true);
          return;
        }

        if (data.alreadyAttempted) {
          router.replace("/already-attempted");
          return;
        }

        setActiveTestInfo(data.activeTest);

        // ✅ load questions
        const qres = await fetch(
          `/api/questions/list?testId=${data.activeTest._id}`
        );

        if (!qres.ok) {
          setNoTestAvailable(true);
          return;
        }

        const qdata = await qres.json();

        let arr = [];
        if (Array.isArray(qdata)) arr = qdata;
        else if (Array.isArray(qdata.questions)) arr = qdata.questions;
        else if (Array.isArray(qdata.data)) arr = qdata.data;

        const normalized = arr.map((q) => ({
          ...q,
          _idStr: idToString(q._id),
          selectedOption: null,
        }));

        setQuestions(normalized);

        if (data.activeTest?.duration) {
          setTotalTimeLeft(Number(data.activeTest.duration) * 60);
        }
      } catch (err) {
        console.error("Init error:", err);
        setNoTestAvailable(true);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (loading || noTestAvailable) return;
    if (submittedRef.current) return;

    timerRef.current = setInterval(() => {
      setTotalTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, noTestAvailable]);

  /* ================= SELECT ================= */
  const selectOption = (opt) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[currentIndex] = {
        ...copy[currentIndex],
        selectedOption: opt,
      };
      return copy;
    });
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    clearInterval(timerRef.current);

    const total = questions.length;
    const correct = questions.filter(
      (q) => q.selectedOption === q.correctAnswer
    ).length;
    const attempted = questions.filter((q) => q.selectedOption).length;
    const wrong = attempted - correct;
    const percent = total ? Math.round((correct / total) * 100) : 0;

    const payload = {
      studentId,
      studentName,
      testId: activeTestInfo?._id,
      total,
      correct,
      wrong,
      attempted,
      percent,
      answers: questions,
      createdAt: new Date().toISOString(),
    };

    try {
      // ⭐ CRITICAL for ResultPage
      sessionStorage.setItem("examAttempt", JSON.stringify(payload));

      await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      router.replace("/result");
    }
  };

  /* ================= GUARDS ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading exam...
      </div>
    );
  }

  if (noTestAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        No tests available right now
      </div>
    );
  }

  const q = questions[currentIndex];
  const answeredCount = questions.filter((x) => x.selectedOption).length;

  /* ================= UI ================= */
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#070b14] text-white p-6"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Technical Assessment
            </h1>
            <p className="text-gray-400 text-sm">
              Student: <strong>{studentName}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Answered: {answeredCount}/{questions.length}
            </p>
          </div>

          <div className="text-yellow-400 font-semibold">
            ⏱ {Math.floor(totalTimeLeft / 60)}m {totalTimeLeft % 60}s
          </div>
        </div>

        {/* Question */}
        {q && (
          <div className="p-6 rounded-xl bg-[#0f172a]">
            <h2 className="mb-4">
              Q{currentIndex + 1}. {q.question}
            </h2>

            <div className="space-y-2">
              {["A", "B", "C", "D"].map((opt) => (
                <label key={opt} className="block cursor-pointer">
                  <input
                    type="radio"
                    checked={q.selectedOption === opt}
                    onChange={() => selectOption(opt)}
                    className="mr-2"
                  />
                  <strong>{opt}.</strong> {q.options?.[opt]}
                </label>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="bg-gray-700 px-4 py-2 rounded disabled:opacity-40"
              >
                Previous
              </button>

              {currentIndex === questions.length - 1 ? (
                <button
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="bg-emerald-600 px-6 py-2 rounded"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="bg-blue-600 px-6 py-2 rounded"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}