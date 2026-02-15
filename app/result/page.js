"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) return;

    const fetchResult = async () => {
      try {
        const res = await fetch(`/api/test/result?id=${id}`);
        const data = await res.json();
        setResult(data);
      } catch (error) {
        console.error("Error fetching result:", error);
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

  const answers = result.answers || [];

const attempted = answers.filter(a => a.selectedOption).length;

const correct = result.score;
const wrong = attempted - correct;
const unanswered = result.totalQuestions - attempted;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-white fade-in">

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
