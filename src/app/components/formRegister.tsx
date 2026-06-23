"use client";
import React, { FormEvent, useState } from "react";
import Link from "next/link";
const MAX_EMAIL_LENGTH = 255;
const MAX_PASSWORD_LENGTH = 255;

export default function FormRegister() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password || !confirmPassword) {
      setError("Email and password are required.");
      return;
    }

    if (normalizedEmail.length > MAX_EMAIL_LENGTH) {
      setError("Email can contain at most 255 characters.");
      return;
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      setError("Password can contain at most 255 characters.");
      return;
    }

    // Validate passwords
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Try block for register
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      // Bind payload to json response
      const payload = await response.json();

      // If reponse is not okay show payload message
      if (!response.ok) {
        throw new Error(payload.message ?? "Registration failed.");
      }

      // Send the user to login
      window.location.href = "/login?registered=1";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed.");
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
        maxLength={MAX_EMAIL_LENGTH}
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
        maxLength={MAX_PASSWORD_LENGTH}
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
        maxLength={MAX_PASSWORD_LENGTH}
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
          hover:cursor-pointer
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
}
