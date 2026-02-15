"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const dynamic = "force-dynamic";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    // ✅ Read id safely from window (client-only)
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) return;

    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/test/result?id=${id}`);
        const data = await res.json();
        setResult(data);
      } catch (err) {
        console.error("Failed to fetch result", err);
      }
    };

    fetchResult();
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading result...
      </div>
    );
  }

  // ✅ Safe calculation (prevents crash if answers missing)
  const answers = result.answers || [];

  const correct = answers.filter(
    (a) => a.selectedOption && a.isCorrect
  ).length;

  const wrong = answers.filter(
    (a) => a.selectedOption && !a.isCorrect
  ).length;

  const unanswered = answers.filter(
    (a) => !a.selectedOption
  ).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center fade-in text-white">

      <h1 className="text-4xl font-bold mb-8">
        Exam Result
      </h1>

      <div className="glass-card p-8 w-96 text-lg space-y-4 rounded-xl">

        <p className="text-2xl font-bold">
          Score: {result.score} / {result.totalQuestions}
        </p>

        <p className="text-green-400">
          ✔ Correct: {correct}
        </p>

        <p className="text-red-400">
          ✘ Wrong: {wrong}
        </p>

        <p className="text-gray-300">
          • Unanswered: {unanswered}
        </p>

      </div>

      <button
        onClick={() => router.push("/dashboard")}
        className="primary-btn mt-6 px-6 py-2 text-white"
      >
        Back to Dashboard
      </button>

    </div>
  );
}
