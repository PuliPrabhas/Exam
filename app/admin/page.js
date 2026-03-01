"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";

/* ---------------------- helpers ---------------------- */
function safeParseJwt(token) {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1];
    // base64 url -> base64
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    // pad if needed
    const pad = b64.length % 4;
    const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
    const json = atob(padded);
    return JSON.parse(json);
  } catch (e) {
    console.warn("safeParseJwt failed", e);
    return null;
  }
}

/* ---------------------- component ---------------------- */
export default function AdminPage() {
  const router = useRouter();

  // data
  const [questions, setQuestions] = useState(null); // null = loading, [] = empty
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTest, setActiveTest] = useState(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editOptions, setEditOptions] = useState({ A: "", B: "", C: "", D: "" });
  const [editCorrectAnswer, setEditCorrectAnswer] = useState("A");

  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");

  const [scheduling, setScheduling] = useState(false);
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");

  // internal refs
  const refreshIntervalRef = useRef(null);

  /* ---------------------- AUTH guard ---------------------- */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const decoded = safeParseJwt(token);
    if (!decoded || decoded.role !== "admin") {
      router.push("/login");
      return;
    }
  }, [router]);

  /* ---------------------- robust fetch functions ---------------------- */
  const fetchQuestions = useCallback(async () => {
    setQuestions(null); // loading
    try {
      const res = await fetch("/api/questions/list");
      if (!res.ok) {
        console.error("questions list status:", res.status);
        setQuestions([]);
        return;
      }
      const data = await res.json();
      console.debug("fetchQuestions response:", data);

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.questions)) {
        list = data.questions;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      } else if (data && data.success && Array.isArray(data.payload)) {
        list = data.payload;
      } else {
        // try fallback: maybe data has a nested field
        const possible = data?.questions ?? data?.data ?? data?.payload ?? null;
        if (Array.isArray(possible)) list = possible;
      }

      // normalize missing option shapes quickly (so UI won't crash)
      const normalized = list.map((q) => ({
        ...q,
        options: q.options && typeof q.options === "object" ? q.options : { A: q.A ?? "", B: q.B ?? "", C: q.C ?? "", D: q.D ?? "" },
        correctAnswer: q.correctAnswer ?? q.correct ?? "",
        _id: q._id ?? q.id ?? q._idStr ?? q.questionNumber ?? null,
      }));

      setQuestions(normalized);
    } catch (err) {
      console.error("Fetch questions error:", err);
      setQuestions([]);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) {
        console.warn("analytics fetch failed:", res.status);
        setAnalytics(null);
        return;
      }
      const data = await res.json();
      setAnalytics(data || null);
    } catch (err) {
      console.error("fetchAnalytics error:", err);
      setAnalytics(null);
    }
  }, []);

  /* ---------------------- FIXED: leaderboard ---------------------- */
  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/leaderboard");
      if (!res.ok) {
        console.warn("leaderboard fetch failed:", res.status);
        setLeaderboard([]);
        return;
      }

      const data = await res.json();
      // debug the raw response to console so you can check backend shape
      console.debug("fetchLeaderboard raw:", data);

      // Accept many shapes:
      // - [] (array)
      // - { leaderboard: [...] }
      // - { data: [...] }
      // - { success: true, leaderboard: [...] }
      // - { success: true, data: [...] }
      let raw = [];

      if (Array.isArray(data)) raw = data;
      else if (Array.isArray(data.leaderboard)) raw = data.leaderboard;
      else if (Array.isArray(data.data)) raw = data.data;
      else {
        // sometimes backend wraps results: { success: true, payload: [...] }
        if (data && data.success && Array.isArray(data.payload)) raw = data.payload;
        else if (data && data.success && Array.isArray(data.leaderboard)) raw = data.leaderboard;
      }

      const cleaned = (Array.isArray(raw) ? raw : [])
        .map((s, i) => ({
          _id: s._id ?? `${s.studentName ?? "unknown"}-${i}`,
          studentName: (s.studentName ?? s.name ?? "").toString().trim() || "Unknown",
          percent: Number(s.percent ?? s.score ?? 0),
        }))
        .filter((r) => !isNaN(r.percent))
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 10);

      setLeaderboard(cleaned);
    } catch (err) {
      console.error("fetchLeaderboard error:", err);
      setLeaderboard([]);
    }
  }, []);

  /* ---------------------- FIXED: active test parser ---------------------- */
  const fetchActiveTest = useCallback(async () => {
    try {
      const res = await fetch("/api/tests/active");
      if (!res.ok) {
        console.warn("active test fetch failed:", res.status);
        setActiveTest(null);
        return;
      }
      const data = await res.json();
      console.debug("fetchActiveTest raw:", data);

      // Accept multiple shapes:
      // - { active: {...} }
      // - { test: {...} }
      // - { testId: "...", startTime, endTime }
      // - { success: true, test: {...} }
      let test = null;
      if (data?.active) test = data.active;
      else if (data?.test) test = data.test;
      else if (data?.testId) {
        test = { _id: data.testId, startTime: data.startTime, endTime: data.endTime };
      } else if (Array.isArray(data?.tests) && data.tests.length > 0) {
        // if backend returns collection, try find one that is active by time
        const now = new Date();
        const found = data.tests.find((t) => {
          try {
            const s = new Date(t.startTime);
            const e = new Date(t.endTime);
            return s <= now && now <= e;
          } catch {
            return false;
          }
        });
        if (found) test = found;
      }

      setActiveTest(test ?? null);
    } catch (err) {
      console.error("fetchActiveTest error:", err);
      setActiveTest(null);
    }
  }, []);

  /* ---------------------- initialization & refresh ---------------------- */
  useEffect(() => {
    // initial load
    fetchQuestions();
    fetchAnalytics();
    fetchLeaderboard();
    fetchActiveTest();

    // live refresh for analytics / leaderboard / active test (every 10s)
    refreshIntervalRef.current = setInterval(() => {
      fetchAnalytics();
      fetchLeaderboard();
      fetchActiveTest();
    }, 10000);

    return () => {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    };
  }, [fetchQuestions, fetchAnalytics, fetchLeaderboard, fetchActiveTest]);

  /* ---------------------- edit / save / delete ---------------------- */
  const handleOpenEdit = (q) => {
    setEditingId(q._id);
    setEditQuestion(q.question ?? "");
    setEditOptions(q.options ?? { A: "", B: "", C: "", D: "" });
    setEditCorrectAnswer(q.correctAnswer ?? "A");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditQuestion("");
    setEditOptions({ A: "", B: "", C: "", D: "" });
    setEditCorrectAnswer("A");
  };

  const handleSave = async (id) => {
    try {
      const payload = {
        _id: id,
        question: editQuestion,
        options: editOptions,
        correctAnswer: editCorrectAnswer,
      };

      const res = await fetch("/api/questions/edit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Save failed: ${res.status}`);
      }

      // refresh
      await fetchQuestions();
      await fetchAnalytics();
      await fetchLeaderboard();
      setEditingId(null);
      alert("Saved successfully");
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed. See console.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this question? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/questions/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || `Delete failed: ${res.status}`);
      }
      await fetchQuestions();
      await fetchAnalytics();
      await fetchLeaderboard();
      alert("Deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed. See console.");
    }
  };

  /* ---------------------- CSV upload (replace + reset attempts) ---------------------- */
  const handleCSVUpload = (file) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Validate / format rows
          const rows = results.data || [];
          if (rows.length === 0) {
            alert("CSV contains no rows.");
            setUploading(false);
            return;
          }

          const formatted = rows.map((row, i) => ({
            questionNumber: i + 1,
            question: (row.question ?? row.q ?? row.Q ?? "").toString(),
            options: {
              A: (row.A ?? row.a ?? "").toString(),
              B: (row.B ?? row.b ?? "").toString(),
              C: (row.C ?? row.c ?? "").toString(),
              D: (row.D ?? row.d ?? "").toString(),
            },
            correctAnswer: (row.correctAnswer ?? row.correct ?? row.correct_answer ?? "").toString().trim(),
          }));

          // Basic sanity check
          const malformed = formatted.filter((r) => !r.question || !r.options.A);
          if (malformed.length > 0) {
            if (!confirm(`${malformed.length} rows look malformed (missing question/option A). Continue upload?`)) {
              setUploading(false);
              return;
            }
          }

          // POST to server upload endpoint
          const res = await fetch("/api/admin/questions/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questions: formatted }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            console.error("Upload response:", data);
            alert(data.message || `Upload failed: ${res.status}`);
            setUploading(false);
            return;
          }

          // expected server behavior: replace questions and reset attempts
          alert(`Uploaded ${data.inserted ?? formatted.length} questions. Attempts should be reset on server.`);

          // Some servers may not reset attempts automatically — attempt to call reset endpoint if present
          try {
            const resetRes = await fetch("/api/admin/attempts/reset", { method: "POST" });
            if (resetRes.ok) {
              console.info("Attempt reset endpoint called successfully.");
            } else {
              console.info("No server-side attempt reset or reset endpoint returned non-OK.");
            }
          } catch (err) {
            // harmless if endpoint missing
            console.debug("attempts reset call failed or not present:", err);
          }

          // refresh local data
          await fetchQuestions();
          await fetchAnalytics();
          await fetchLeaderboard();
          await fetchActiveTest();
        } catch (err) {
          console.error("CSV processing/upload error:", err);
          alert("CSV upload failed. See console.");
        } finally {
          setUploading(false);
        }
      },
      error: (err) => {
        console.error("Papa parse error:", err);
        alert("CSV parse failed.");
        setUploading(false);
      },
    });
  };

  /* ---------------------- scheduling ---------------------- */
  const handleSchedule = async () => {
    if (activeTest) {
      alert("A test is already active. End it before scheduling a new one.");
      return;
    }
    if (!scheduleStart || !scheduleEnd) {
      alert("Please choose start and end time.");
      return;
    }
    const s = new Date(scheduleStart);
    const e = new Date(scheduleEnd);
    if (isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e) {
      alert("Invalid start/end time.");
      return;
    }

    setScheduling(true);
    try {
      const res = await fetch("/api/admin/tests/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: scheduleTitle || "Scheduled Test",
          startTime: s.toISOString(),
          endTime: e.toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Schedule failed:", data);
        alert(data.message || `Schedule failed: ${res.status}`);
      } else {
        alert("Test scheduled.");
        setScheduleTitle("");
        setScheduleStart("");
        setScheduleEnd("");
        await fetchActiveTest();
        await fetchAnalytics();
        await fetchLeaderboard();
      }
    } catch (err) {
      console.error("Schedule error:", err);
      alert("Scheduling failed. See console.");
    } finally {
      setScheduling(false);
    }
  };

  const handleEndActiveTest = async () => {
    if (!activeTest?._id) {
      alert("No active test to end.");
      return;
    }
    if (!confirm("End the active test now?")) return;

    try {
      const res = await fetch(`/api/admin/tests/${activeTest._id}/end`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("End test failed:", data);
        alert(data.message || `Failed to end test: ${res.status}`);
      } else {
        alert("Active test ended.");
        await fetchActiveTest();
        await fetchAnalytics();
        await fetchLeaderboard();
      }
    } catch (err) {
      console.error("End active test error:", err);
      alert("Failed to end test. See console.");
    }
  };

  /* ---------------------- filtered list ---------------------- */
  const filtered = (questions ?? []).filter((q) =>
    `${q.question} ${JSON.stringify(q.options)}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  /* ---------------------- render ---------------------- */
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="flex justify-between items-start mb-8">
        <h1 className="text-4xl font-bold">Manage Questions – Technical Assessment</h1>
        <div className="flex flex-col items-end gap-3">
          <button onClick={handleLogout} className="bg-red-600 px-4 py-2 rounded">Logout</button>
          {activeTest ? (
            <div className="text-sm text-gray-400 text-right">
              Active: {activeTest?.startTime ? new Date(activeTest.startTime).toLocaleString() : "–"} → {activeTest?.endTime ? new Date(activeTest.endTime).toLocaleString() : "–"}
            </div>
          ) : (
            <div className="text-sm text-gray-400 text-right">No active test</div>
          )}
        </div>
      </div>

      {/* Upload Card */}
      <div className="mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#020617] border border-white/10 p-8">
          <h2 className="text-2xl font-semibold mb-2">Upload Questions</h2>
          <p className="text-gray-400 text-sm mb-6">CSV format: question, A, B, C, D, correctAnswer</p>

          <input id="csvUpload" type="file" accept=".csv" className="hidden" onChange={(e) => handleCSVUpload(e.target.files?.[0])} />
          <label htmlFor="csvUpload" className="inline-flex items-center gap-3 cursor-pointer bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-semibold">
            📁 Choose CSV File
          </label>

          {selectedFileName && <p className="mt-4 text-sm text-emerald-400">Selected: {selectedFileName}</p>}
          {uploading && <div className="mt-4 text-yellow-400">Uploading questions...</div>}
        </div>
      </div>

      {/* Schedule Card */}
      <div className="mb-8 bg-gradient-to-br from-[#0f172a] to-[#020617] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Schedule Test</h3>
          <div className="text-sm text-gray-400">{activeTest ? `Active: ${activeTest?.startTime ? new Date(activeTest.startTime).toLocaleString() : "–"} → ${activeTest?.endTime ? new Date(activeTest.endTime).toLocaleString() : "–"}` : "No active test"}</div>
        </div>

        {activeTest ? (
          <div className="mt-4 flex gap-3">
            <button onClick={handleEndActiveTest} className="bg-yellow-600 hover:bg-yellow-500 px-4 py-2 rounded">End Active Test</button>
            <button onClick={() => {
              // copy active times into inputs (ISO 16 local format)
              try {
                setScheduleStart(new Date(activeTest.startTime).toISOString().slice(0, 16));
                setScheduleEnd(new Date(activeTest.endTime).toISOString().slice(0, 16));
              } catch {
                // ignore
              }
            }} className="bg-gray-700 px-4 py-2 rounded">Copy active times</button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <input placeholder="Title (optional)" value={scheduleTitle} onChange={(e) => setScheduleTitle(e.target.value)} className="p-2 bg-gray-900 rounded" />
            <input type="datetime-local" value={scheduleStart} onChange={(e) => setScheduleStart(e.target.value)} className="p-2 bg-gray-900 rounded" />
            <input type="datetime-local" value={scheduleEnd} onChange={(e) => setScheduleEnd(e.target.value)} className="p-2 bg-gray-900 rounded" />
            <div className="md:col-span-3">
              <button onClick={handleSchedule} disabled={scheduling} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded mt-2">Schedule Test</button>
            </div>
          </div>
        )}
      </div>

      {/* Search + Stats */}
      <div className="mb-6">
        <input placeholder="Search questions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full p-3 rounded bg-gray-900 border border-gray-700" />
      </div>

      {analytics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm">Total Attempts</p>
            <p className="text-3xl font-bold mt-2">{analytics.totalAttempts ?? 0}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm">Average Score</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">{analytics.averageScore ?? 0}%</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm">Highest Score</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{analytics.highestScore ?? 0}%</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-2xl border border-white/10">
            <p className="text-gray-400 text-sm">Pass Percentage</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{analytics.passPercentage ?? 0}%</p>
          </div>
        </div>
      )}

      {leaderboard.length > 0 && (
        <div className="bg-gray-900 p-6 rounded-2xl border border-white/10 mb-10 max-w-xs">
          <h2 className="text-xl font-semibold mb-4">🏆 Top Performers</h2>
          <div className="space-y-2">
            {leaderboard.map((s, idx) => (
              <div key={`${s._id}-${idx}`} className="flex justify-between bg-black/40 p-3 rounded-lg">
                <span>#{idx + 1} — {s.studentName}</span>
                <span className="text-green-400 font-semibold">{s.percent ?? 0}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions list */}
      <div className="mb-16">
        {questions === null ? (
          <p className="text-gray-400">Loading questions...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-400">No questions found.</p>
        ) : (
          <div className="grid gap-4">
            {filtered.map((q, idx) => (
              <div key={q._id ?? idx} className="bg-gray-900 p-6 rounded-xl">
                {editingId === q._id ? (
                  <div className="space-y-3">
                    <input value={editQuestion} onChange={(e) => setEditQuestion(e.target.value)} className="w-full p-2 bg-gray-800 rounded" />
                    {["A", "B", "C", "D"].map((opt) => (
                      <input key={opt} value={editOptions?.[opt] || ""} onChange={(e) => setEditOptions((p) => ({ ...p, [opt]: e.target.value }))} className="w-full p-2 bg-gray-800 rounded" placeholder={`Option ${opt}`} />
                    ))}
                    <select value={editCorrectAnswer} onChange={(e) => setEditCorrectAnswer(e.target.value)} className="w-full p-2 bg-gray-800 rounded">
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(q._id)} className="bg-green-600 px-4 py-2 rounded">Save</button>
                      <button onClick={handleCancelEdit} className="bg-gray-700 px-4 py-2 rounded">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-400">Q{idx + 1}</p>
                    <p className="text-lg">{q.question}</p>
                    <div className="mt-2">
                      {Object.entries(q.options || {}).map(([k, v]) => (
                        <p key={k}><strong>{k}.</strong> {v}</p>
                      ))}
                    </div>
                    <p className="text-green-400 mt-2">Correct: {q.correctAnswer}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleOpenEdit(q)} className="bg-blue-600 px-3 py-1 rounded">Edit</button>
                      <button onClick={() => handleDelete(q._id)} className="bg-red-600 px-3 py-1 rounded">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}