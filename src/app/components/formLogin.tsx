"use client";
import React, { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function FormLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccessfully] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("registered") === "1",
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Login failed.");
      }

      console.log("Login success:", payload);
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Login failed.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col p-6 text-zinc-600 rounded-xl gap-4 w-120 bg-white"
    >
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="
          w-full
          rounded-lg
          border border-zinc-300
          bg-zinc-50
          px-4 py-3
          text-zinc-700
          placeholder:text-zinc-400
          transition-all duration-200
          hover:border-[#4E3D42]
          focus:outline-none
          focus:ring-2
          focus:ring-[#4E3D42]/30
          focus:border-[#4E3D42]
        "
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="
          w-full
          rounded-lg
          border border-zinc-300
          bg-zinc-50
          px-4 py-3
          text-zinc-700
          placeholder:text-zinc-400
          transition-all duration-200
          hover:border-[#4E3D42]
          focus:outline-none
          focus:ring-2
          focus:ring-[#4E3D42]/30
          focus:border-[#4E3D42]
        "
      />

      <button
        type="submit"
        className="
          w-full
          rounded-lg
          bg-[#4E3D42]
          py-3
          text-white
          font-medium
          transition-all duration-200
          hover:bg-[#3f3135]
          active:scale-95
        "
      >
        Login
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-300" />
        <span className="text-xs text-zinc-400 uppercase tracking-wide">
          or
        </span>
        <div className="h-px flex-1 bg-zinc-300" />
      </div>

      <button
        type="button"
        className="
          w-full
          rounded-lg
          border border-zinc-300
          bg-white
          py-3
          text-zinc-700
          font-medium
          flex items-center justify-center gap-2
          transition-all duration-200
          hover:bg-zinc-50
          active:scale-95
        "
      >
        <Image src="/google.png" alt="Google" width={20 } height={20} />
        Login with Google
      </button>

      {registeredSuccessfully && (
        <p className="text-sm text-green-600">
          Account created successfully. You can log in now.
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Link
        href="/register"
        className="text-sm text-[#4E3D42] hover:underline text-center"
      >
        Dont have an account? Register
      </Link>
    </form>
  );
}
