"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);

  /* ================= AUTH ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      const decoded = jwtDecode(token);

      if (decoded.role !== "student") {
        return router.push("/login");
      }

      setUser(decoded);

      fetch(`/api/test/history?studentId=${decoded.id}`)
        .then(res => res.json())
        .then(data => {
          setAttemptCount(data.count || 0);
        });

    } catch {
      router.push("/login");
    }
  }, []);

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-blue-950 text-white relative">

      {/* LOGOUT BUTTON */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
      >
        Logout
      </button>

      <div className="bg-gray-900 p-10 rounded-2xl shadow-xl w-full max-w-lg text-center">

        <h1 className="text-3xl font-bold mb-8">
          Student Dashboard
        </h1>

        <div className="text-left space-y-3 mb-8">
          <p><span className="font-semibold">Name:</span> {user.name}</p>
          <p><span className="font-semibold">Email:</span> {user.email}</p>
          <p><span className="font-semibold">Role:</span> {user.role}</p>
          <p><span className="font-semibold">Tests Attempted:</span> {attemptCount}</p>
        </div>

        <button
          onClick={() => router.push("/test")}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition font-semibold"
        >
          Start Test
        </button>

      </div>
    </div>
  );
}
