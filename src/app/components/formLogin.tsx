"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";

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

    // Try block for login
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

      // Bind payload to json response
      const payload = await response.json();

      // If reponse is not okay show payload message
      if (!response.ok) {
        throw new Error(payload.message ?? "Login failed.");
      }

      // Send the user to dashboard
      window.location.href = "/dashboard";
    } catch (error) {
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
        Login
      </button>

      {registeredSuccessfully && (
        <p className="text-sm text-green-600">
          Account created successfully. You can log in now.
        </p>
      )}

      <Link
        href="/register"
        className="text-sm text-[#4E3D42] hover:underline text-center"
      >
        Dont have an account? Register
      </Link>
    </form>
  );
}
