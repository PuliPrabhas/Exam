"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          rollNumber,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Registration successful!");
        router.push("/login");
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (error) {
      alert("Server error");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-blue-950">
      <div className="bg-gray-900 p-8 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          Student Registration
        </h2>

        <form onSubmit={handleRegister} className="space-y-4">

          <input
            type="text"
            placeholder="Full Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />

          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />

          <input
            type="text"
            placeholder="Roll Number"
            required
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-white"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-2 rounded text-white font-semibold"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {/* LOGIN OPTION */}
        <p className="text-sm text-center text-gray-400 mt-4">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/login")}
            className="text-blue-400 cursor-pointer hover:underline"
          >
            Login
          </span>
        </p>
      </div>
    </div>
  );
}
