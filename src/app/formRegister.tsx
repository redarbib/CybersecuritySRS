"use client";
import React, { FormEvent, useState } from "react";
import Link from "next/link";

const FormRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
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
        throw new Error(payload.message ?? "Registration failed.");
      }

      console.log("Register success:", payload);
    } catch (error) {
      console.error(error);
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

      <input
        type="password"
        placeholder="Repeat password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
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

      {error && <p className="text-sm text-red-500">{error}</p>}

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
        Register
      </button>

      <Link
        href="/login"
        className="text-sm text-[#4E3D42] hover:underline text-center"
      >
        Already have an account? Login
      </Link>
    </form>
  );
};

export default FormRegister;
