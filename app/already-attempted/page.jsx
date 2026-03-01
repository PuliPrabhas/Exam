"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AlreadyAttemptedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl w-full bg-gradient-to-br from-[#0f172a] to-[#020617] border border-white/10 rounded-2xl p-10 text-center shadow-2xl"
      >
        <div className="text-5xl mb-4">🚫</div>

        <h1 className="text-2xl font-bold mb-3">
          Test Already Attempted
        </h1>

        <p className="text-gray-400 mb-6">
          You have already completed this test.
          <br />
          Multiple attempts are not allowed.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/result")}
            className="bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-lg font-semibold"
          >
            View Result
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gray-700 hover:bg-gray-600 px-5 py-2 rounded-lg font-semibold"
          >
            Go Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}