"use client";

import { useEffect, useState } from "react";

export default function ResultPage() {
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= LOAD RESULT ================= */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("examAttempt");

      if (!raw) {
        setAttempt(null);
        setLoading(false);
        return;
      }

      const parsed = JSON.parse(raw);

      // ✅ defensive normalization
      const normalized = {
        studentName: parsed.studentName ?? "Unknown",
        total: Number(parsed.total ?? 0),
        correct: Number(parsed.correct ?? 0),
        wrong: Number(parsed.wrong ?? 0),
        attempted: Number(parsed.attempted ?? 0),
        percent: Number(parsed.percent ?? 0),
      };

      setAttempt(normalized);
    } catch (err) {
      console.error("Result parse error:", err);
      setAttempt(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Loading result...
      </div>
    );
  }

  /* ================= NO RESULT ================= */
  if (!attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-8">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            No result found
          </h2>
          <p className="text-gray-400">
            Please complete the test first.
          </p>
        </div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-[#070b14] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Exam Result</h1>

        {/* Student */}
        <div className="bg-gray-900 p-6 rounded-xl mb-6">
          <p className="text-gray-400 text-sm">Student</p>
          <p className="text-xl font-semibold">
            {attempt.studentName}
          </p>
        </div>

        {/* Score Highlight */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-500 p-6 rounded-xl mb-6 text-center">
          <p className="text-sm text-white/80 mb-1">
            Final Score
          </p>
          <p className="text-4xl font-bold">
            {attempt.percent}%
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Total" value={attempt.total} />
          <Stat label="Correct" value={attempt.correct} />
          <Stat label="Wrong" value={attempt.wrong} />
          <Stat label="Attempted" value={attempt.attempted} />
        </div>
      </div>
    </div>
  );
}

/* ================= STAT CARD ================= */
function Stat({ label, value }) {
  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}