"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      alert("Invalid password");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-xl shadow w-96"
      >
        <h1 className="text-2xl font-bold mb-6">
          Admin Login
        </h1>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded p-3 mb-4"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
        >
          Login
        </button>
      </form>
    </main>
  );
}