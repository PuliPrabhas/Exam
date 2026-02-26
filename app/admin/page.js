"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

function safeParseJwt(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [analytics, setAnalytics] = useState(null);
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

    const decoded = safeParseJwt(token);
    if (!decoded || decoded.role !== "admin") {
      router.push("/login");
    }
  }, [router]);

  /* ================= FETCH QUESTIONS ================= */
  const fetchQuestions = async () => {
    try {
      const res = await fetch("/api/questions/list");
      const data = await res.json();

      if (Array.isArray(data)) setQuestions(data);
      else if (Array.isArray(data.questions)) setQuestions(data.questions);
      else setQuestions([]);
    } catch (err) {
      console.error("Fetch questions error:", err);
      setQuestions([]);
    }
  };

  useEffect(() => {
    fetchQuestions();
     fetchAnalytics();
  }, []);

  /* ================= EDIT ================= */
  const handleOpenEdit = (q) => {
    setEditingId(q._id);
    setEditQuestion(q.question);
    setEditOptions(q.options || { A: "", B: "", C: "", D: "" });
    setEditCorrectAnswer(q.correctAnswer);
  };

  const handleSave = async (id) => {
    try {
      await fetch("/api/questions/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: id,
          question: editQuestion,
          options: editOptions,
          correctAnswer: editCorrectAnswer,
        }),
      });

      setEditingId(null);
      fetchQuestions();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (!confirm("Delete this question?")) return;

    try {
      await fetch("/api/questions/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      fetchQuestions();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  /* ================= CSV UPLOAD ================= */
  const handleCSVUpload = (file) => {
    if (!file) return;
setSelectedFileName(file.name); // ⭐ NEW
  setUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const formatted = results.data.map((row, index) => ({
            questionNumber: index + 1,
            question: row.question,
            options: {
              A: row.A,
              B: row.B,
              C: row.C,
              D: row.D,
            },
            correctAnswer: row.correctAnswer,
          }));

          const res = await fetch("/api/admin/questions/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions: formatted }),
          });

          const data = await res.json();

          if (!res.ok) {
            alert(data.message || "Upload failed");
            return;
          }

          alert(`✅ ${data.inserted} questions uploaded`);

          await fetchQuestions();
        } catch (err) {
          console.error(err);
          alert("CSV processing failed");
        } finally {
          setUploading(false);
        }
      },
    });
  };

  /* ================= SEARCH ================= */
  const filtered = questions.filter((q) =>
    `${q.question} ${JSON.stringify(q.options)}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const fetchAnalytics = async () => {
  try {
    const res = await fetch("/api/admin/analytics");
    const data = await res.json();
    setAnalytics(data);
  } catch (err) {
    console.error(err);
  }
};
  return (
    <div className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <div className="flex justify-between mb-8">
        <h1 className="text-4xl font-bold">
          Manage Questions – Technical Assessment 2026
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-600 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* CSV Upload */}
     {/* ================= MODERN CSV UPLOAD ================= */}
<div className="mb-8">
  <div className="
    relative overflow-hidden
    rounded-2xl
    bg-gradient-to-br from-[#0f172a] to-[#020617]
    border border-white/10
    p-8
    shadow-[0_20px_80px_rgba(0,0,0,0.6)]
  ">
    
    {/* subtle glow */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_60%)] pointer-events-none" />

    <h2 className="text-2xl font-semibold mb-2 tracking-wide">
      Upload Questions
    </h2>

    <p className="text-gray-400 text-sm mb-6">
      CSV format: question, A, B, C, D, correctAnswer
    </p>

    {/* Hidden input */}
    <input
      id="csvUpload"
      type="file"
      accept=".csv"
      className="hidden"
      onChange={(e) => handleCSVUpload(e.target.files?.[0])}
    />

    {/* Visible button */}
    <label
      htmlFor="csvUpload"
      className="
        inline-flex items-center gap-3
        cursor-pointer
        bg-blue-600 hover:bg-blue-500
        active:scale-[0.98]
        transition-all duration-200
        px-6 py-3 rounded-xl
        font-semibold
        shadow-[0_10px_40px_rgba(37,99,235,0.35)]
      "
    >
      📁 Choose CSV File
    </label>

    {/* File name */}
    {selectedFileName && (
      <p className="mt-4 text-sm text-emerald-400">
        Selected: {selectedFileName}
      </p>
    )}

    {/* Uploading indicator */}
    {uploading && (
      <div className="mt-4 flex items-center gap-2 text-yellow-400">
        <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
        Uploading questions...
      </div>
    )}
  </div>
</div>

      {/* Search */}
      <div className="mb-6">
        <input
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 rounded bg-gray-900 border border-gray-700"
        />
      </div>
      {analytics && (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

    <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
      <p className="text-gray-400 text-sm">Total Attempts</p>
      <p className="text-3xl font-bold mt-2">
        {analytics.totalAttempts}
      </p>
    </div>

    <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
      <p className="text-gray-400 text-sm">Average Score</p>
      <p className="text-3xl font-bold text-yellow-400 mt-2">
        {analytics.averageScore}%
      </p>
    </div>

    <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
      <p className="text-gray-400 text-sm">Highest Score</p>
      <p className="text-3xl font-bold text-green-400 mt-2">
        {analytics.highestScore}%
      </p>
    </div>

    <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
      <p className="text-gray-400 text-sm">Pass Percentage</p>
      <p className="text-3xl font-bold text-blue-400 mt-2">
        {analytics.passPercentage}%
      </p>
    </div>

  </div>
)}

      {/* Questions */}
      {filtered.length === 0 ? (
        <p className="text-gray-400">No questions found.</p>
      ) : (
        <div className="grid gap-4">
          {filtered.map((q, idx) => (
            <div key={q._id} className="bg-gray-900 p-6 rounded-xl">
              {editingId === q._id ? (
                <div className="space-y-3">
                  <input
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    className="w-full p-2 bg-gray-800 rounded"
                  />

                  {["A", "B", "C", "D"].map((opt) => (
                    <input
                      key={opt}
                      value={editOptions?.[opt] || ""}
                      onChange={(e) =>
                        setEditOptions((p) => ({
                          ...p,
                          [opt]: e.target.value,
                        }))
                      }
                      className="w-full p-2 bg-gray-800 rounded"
                      placeholder={`Option ${opt}`}
                    />
                  ))}

                  <select
                    value={editCorrectAnswer}
                    onChange={(e) => setEditCorrectAnswer(e.target.value)}
                    className="w-full p-2 bg-gray-800 rounded"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>

                  <button
                    onClick={() => handleSave(q._id)}
                    className="bg-green-600 px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400">Q{idx + 1}</p>
                  <p className="text-lg">{q.question}</p>

                  <div className="mt-2">
                    {Object.entries(q.options || {}).map(([k, v]) => (
                      <p key={k}>
                        <strong>{k}.</strong> {v}
                      </p>
                    ))}
                  </div>

                  <p className="text-green-400 mt-2">
                    Correct: {q.correctAnswer}
                  </p>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="bg-blue-600 px-3 py-1 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(q._id)}
                      className="bg-red-600 px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}