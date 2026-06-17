"use client";
import React, { FormEvent, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function FormReset() {
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message ?? "Password reset failed.");
      }

      console.log("Password reset success:", payload);
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
        Forget password
      </button>
    </form>
  );
}