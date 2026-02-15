"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function AdminPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editOptions, setEditOptions] = useState({
    A: "",
    B: "",
    C: "",
    D: "",
  });
  const [editCorrectAnswer, setEditCorrectAnswer] = useState("A");

  /* ================= AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      const decoded = jwtDecode(token);
      if (decoded.role !== "admin") {
        return router.push("/login");
      }
    } catch {
      router.push("/login");
    }
  }, []);

  /* ================= FETCH ================= */
  const fetchQuestions = async () => {
    const res = await fetch("/api/questions/list");
    const data = await res.json();
    setQuestions(data);
  };

  const fetchAnalytics = async () => {
    const res = await fetch("/api/admin/analytics");
    const data = await res.json();
    setAnalytics(data);
  };

  useEffect(() => {
    fetchQuestions();
    fetchAnalytics();
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  /* ================= SAVE EDIT ================= */
  const handleSave = async (id) => {
    try {
      const res = await fetch("/api/questions/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: id,
          question: editQuestion,
          options: editOptions,
          correctAnswer: editCorrectAnswer,
        }),
      });

      if (res.ok) {
        alert("Question updated successfully");
        setEditingId(null);
        fetchQuestions();
      }
    } catch {
      alert("Update failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-black text-white p-8 relative">

      {/* LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
      >
        Logout
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Manage Questions – Technical Assessment 2026
      </h1>

      {/* TEST INFO */}
      <div className="bg-gray-800 p-6 rounded-xl mb-6 border border-gray-700">
        <h2 className="text-xl font-semibold mb-2">
          Technical Assessment 2026
        </h2>
        <p>Total Questions: {questions.length}</p>
        <p>Duration: 30 Minutes</p>
      </div>

      {/* QUESTIONS */}
      {questions.map((q, index) => (
        <div
          key={q._id}
          className="bg-gray-900 p-5 rounded-xl mb-4 border border-gray-700"
        >
          {editingId === q._id ? (
            <div className="space-y-3">

              <input
                className="w-full p-2 bg-gray-800 rounded"
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
              />

              {["A", "B", "C", "D"].map((opt) => (
                <input
                  key={opt}
                  type="text"
                  value={editOptions[opt]}
                  onChange={(e) =>
                    setEditOptions({
                      ...editOptions,
                      [opt]: e.target.value,
                    })
                  }
                  className="w-full p-2 bg-gray-800 rounded"
                  placeholder={`Option ${opt}`}
                />
              ))}

              <select
                value={editCorrectAnswer}
                onChange={(e) =>
                  setEditCorrectAnswer(e.target.value)
                }
                className="w-full p-2 bg-gray-800 rounded"
              >
                <option value="A">Correct: A</option>
                <option value="B">Correct: B</option>
                <option value="C">Correct: C</option>
                <option value="D">Correct: D</option>
              </select>

              <button
                onClick={() => handleSave(q._id)}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Save
              </button>

            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-400">
                  Q{index + 1}
                </p>
                <p className="text-lg font-medium">
                  {q.question}
                </p>
                <p className="text-sm text-green-400">
                  Correct: {q.correctAnswer}
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingId(q._id);
                  setEditQuestion(q.question);
                  setEditOptions(q.options);
                  setEditCorrectAnswer(q.correctAnswer);
                }}
                className="bg-blue-600 px-4 py-2 rounded"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      ))}

      {/* ANALYTICS */}
      {analytics && (
        <div className="mt-10">
          <h2 className="text-2xl font-bold mb-4">
            Analytics Overview
          </h2>

          <div className="grid grid-cols-2 gap-6">

            <div className="bg-gray-800 p-6 rounded-xl">
              <p>Total Attempts</p>
              <p className="text-2xl font-bold">
                {analytics.totalAttempts}
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <p>Average Score</p>
              <p className="text-2xl font-bold text-green-400">
                {analytics.averageScore}
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <p>Highest Score</p>
              <p className="text-2xl font-bold text-yellow-400">
                {analytics.highestScore}
              </p>
            </div>

            <div className="bg-gray-800 p-6 rounded-xl">
              <p>Pass Percentage</p>
              <p className="text-2xl font-bold text-purple-400">
                {analytics.passPercentage}%
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
