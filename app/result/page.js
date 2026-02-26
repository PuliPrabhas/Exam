"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("examResult");

    if (!stored) {
      router.push("/");
      return;
    }

    try {
      setResult(JSON.parse(stored));
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-white">
        Loading results...
      </div>
    );
  }

  const {
    total,
    correct,
    wrong,
    attempted,
    locked,
    percent,
  } = result;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b14] text-white">
      <div className="bg-gradient-to-br from-[#0f172a] to-[#020617]
                      border border-white/10
                      rounded-3xl
                      p-10
                      shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                      max-w-xl w-full">

        <h1 className="text-3xl font-semibold mb-8 text-center">
          Exam Result
        </h1>

        {/* Score */}
        <div className="grid grid-cols-2 gap-4 mb-8">

          <Stat label="Total Questions" value={total} />
          <Stat label="Attempted" value={attempted} />
          <Stat label="Correct" value={correct} green />
          <Stat label="Wrong" value={wrong} red />
          <Stat label="Locked" value={locked} />
          <Stat label="Percentage" value={`${percent}%`} yellow />

        </div>

        {/* Big score */}
        <div className="text-center mb-8">
          <p className="text-gray-400 mb-2">Final Score</p>
          <p className="text-5xl font-bold text-emerald-400">
            {correct} / {total}
          </p>
        </div>

        <button
          onClick={() => router.push("/")}
          className="w-full bg-blue-600 hover:bg-blue-500
                     transition-all duration-300
                     px-6 py-3 rounded-xl font-semibold"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}

/* ================= SMALL COMPONENT ================= */

function Stat({ label, value, green, red, yellow }) {
  let color = "text-white";
  if (green) color = "text-emerald-400";
  if (red) color = "text-red-400";
  if (yellow) color = "text-yellow-400";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className={`text-xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}