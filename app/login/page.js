"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");

  const handleLogin = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);

      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } else {
      alert(data.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleLogin}
        className="bg-gray-900 p-8 rounded-lg w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-center">Login</h2>

        {/* Role Selection */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 rounded bg-gray-800"
        >
          <option value="student">Student Login</option>
          <option value="admin">Admin Login</option>
        </select>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 rounded bg-gray-800"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 rounded bg-gray-800"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded"
        >
          Login
        </button>

        <p className="text-sm text-center">
          Don’t have an account?{" "}
          <span
            className="text-blue-400 cursor-pointer"
            onClick={() => router.push("/")}
          >
            Register
          </span>
        </p>
      </form>
    </div>
  );
}
