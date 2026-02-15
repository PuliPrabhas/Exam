"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function TestPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [totalTimeLeft, setTotalTimeLeft] = useState(1800); // 30 mins
  const [examEnded, setExamEnded] = useState(false);
  const [studentId, setStudentId] = useState(null);

  const globalTimerRef = useRef(null);
  const questionTimerRef = useRef(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "student") {
        return router.push("/login");
      }

      setStudentId(decoded.id);
      fetchQuestions();
    } catch {
      router.push("/login");
    }
  }, []);

  /* ================= FETCH QUESTIONS ================= */
  const fetchQuestions = async () => {
    const res = await fetch("/api/questions/list");
    const data = await res.json();

    const initialized = data.map((q) => ({
      ...q,
      selectedOption: null,
      timeLeft: 60,
      locked: false,
    }));

    setQuestions(initialized);
  };

  /* ================= GLOBAL TIMER ================= */
  useEffect(() => {
    globalTimerRef.current = setInterval(() => {
      setTotalTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(globalTimerRef.current);
          setExamEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(globalTimerRef.current);
  }, []);

  /* ================= QUESTION TIMER ================= */
  useEffect(() => {
    if (!activeQuestion) return;

    clearInterval(questionTimerRef.current);

    questionTimerRef.current = setInterval(() => {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q._id === activeQuestion && !q.locked) {
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
  }, [activeQuestion]);

  /* ================= AUTO SUBMIT ================= */
  useEffect(() => {
    if (examEnded) {
      submitExam();
    }
  }, [examEnded]);

  /* ================= SUBMIT ================= */
  const submitExam = async () => {
    if (!studentId) return;

    const answersPayload = questions.map((q) => ({
      questionId: q._id,
      selectedOption: q.selectedOption,
    }));

    try {
      const res = await fetch("/api/test/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          answers: answersPayload,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/result?id=${data.attemptId}`);
      } else {
        alert("Submission failed.");
      }
    } catch {
      alert("Server error.");
    }
  };

  const handleManualSubmit = () => {
    if (!confirm("Are you sure you want to submit?")) return;
    setExamEnded(true);
  };

  /* ================= HANDLERS ================= */
  const handleActivate = (id) => {
    const question = questions.find((q) => q._id === id);
    if (!question?.locked) setActiveQuestion(id);
  };

  const handleSelect = (id, option) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q._id === id && !q.locked
          ? { ...q, selectedOption: option }
          : q
      )
    );
  };

  /* ================= COUNTS ================= */
  const answered = questions.filter((q) => q.selectedOption).length;
  const unanswered = questions.filter((q) => !q.selectedOption).length;
  const locked = questions.filter((q) => q.locked).length;

  /* ================= RETURN UI ================= */
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black via-slate-900 to-black text-white">

      {/* QUESTIONS AREA */}
      <div className="w-3/4 p-8 space-y-6 overflow-y-auto">
        {questions.map((q, index) => (
          <div
            key={q._id}
            className={`p-6 rounded-xl border transition ${
              activeQuestion === q._id
                ? "border-blue-500 bg-slate-800"
                : "border-gray-700 bg-slate-900"
            }`}
            onClick={() => handleActivate(q._id)}
          >
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold text-lg">
                Q{index + 1}. {q.question}
              </h2>

              {activeQuestion === q._id && !q.locked && (
                <span className="text-red-400 font-bold">
                  ⏱ {q.timeLeft}s
                </span>
              )}
            </div>

            {["A", "B", "C", "D"].map((opt) => (
              <div key={opt} className="flex items-center space-x-2 mt-2">
                <input
                  type="radio"
                  checked={q.selectedOption === opt}
                  onChange={() => handleSelect(q._id, opt)}
                  disabled={q.locked}
                />
                <label>{q.options[opt]}</label>
              </div>
            ))}

            {q.locked && (
              <p className="text-red-500 text-sm mt-2">
                🔒 Locked
              </p>
            )}
          </div>
        ))}
      </div>

      {/* SIDEBAR */}
      <div className="w-1/4 bg-slate-900 p-6 sticky top-0 h-screen flex flex-col border-l border-gray-700">

        <h2 className="text-xl font-bold mb-4">Exam Info</h2>

        <div className="text-3xl font-bold text-red-400 mb-6">
          {Math.floor(totalTimeLeft / 60).toString().padStart(2, "0")}:
          {(totalTimeLeft % 60).toString().padStart(2, "0")}
        </div>

        <p>Total: {questions.length}</p>
        <p>Answered: {answered}</p>
        <p>Unanswered: {unanswered}</p>
        <p>Locked: {locked}</p>

        {/* SIDE NAVIGATION GRID */}
        <div className="grid grid-cols-5 gap-2 mt-6">
          {questions.map((q, index) => (
            <button
              key={q._id}
              onClick={() => handleActivate(q._id)}
              className={`h-8 w-8 rounded-full text-sm transition
                ${
                  q.selectedOption
                    ? "bg-green-600"
                    : q.locked
                    ? "bg-red-600"
                    : "bg-gray-700"
                }
              `}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          onClick={handleManualSubmit}
          className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 py-2 rounded-lg hover:opacity-90"
        >
          Submit Exam
        </button>
      </div>
    </div>
  );
}
