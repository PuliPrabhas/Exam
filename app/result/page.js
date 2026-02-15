"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResultPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/test/result?id=${id}`)
      .then(res => res.json())
      .then(data => setResult(data));
  }, [id]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading result...
      </div>
    );
  }

  const correct = result.answers.filter(a => a.selectedOption && a.isCorrect).length;
  const wrong = result.answers.filter(a => a.selectedOption && !a.isCorrect).length;
  const unanswered = result.answers.filter(a => !a.selectedOption).length;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center fade-in">

      <h1 className="text-4xl font-bold mb-8">Exam Result</h1>

      <div className="glass-card p-8 w-96 text-lg space-y-4">

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
