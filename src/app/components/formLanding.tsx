"use client";

import { FormEvent, useState } from "react";
import Button from "./ui/button";

type ApiResponse = {
  message?: string;
};

export default function FormLanding(){
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputClass =
    "w-full text-black bg-transparent p-2 m-1 border-b border-black outline-none";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");

    setStatusMessage(null);

    if (!selectedFile) {
      setStatusMessage("First add a file.");
      return;
    }

    setIsSubmitting(true);

    try {
      const registerResponse = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const registerPayload = (await registerResponse.json()) as ApiResponse;

      if (registerResponse.ok) {
        window.location.href = `/dashboard?email=${encodeURIComponent(
          String(email ?? ""),
        )}`;
        return;
      }

      if (registerResponse.status === 409) {
        const loginResponse = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const loginPayload = (await loginResponse.json()) as ApiResponse;

        if (!loginResponse.ok) {
          throw new Error(loginPayload.message ?? "Login failed.");
        }

        window.location.href = `/dashboard?email=${encodeURIComponent(
          String(email ?? ""),
        )}`;
        return;
      }

      if (!registerResponse.ok) {
        throw new Error(registerPayload.message ?? "Registration failed.");
      }
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl mr-auto p-8 bg-white rounded-lg"
      >
        <div className="w-full flex flex-col gap-3 mb-4">
          <div className="flex w-full gap-4">
            <label className="flex h-32 flex-1 cursor-pointer items-center justify-center rounded bg-[#5D474D] text-white">
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/plus.svg"
                  alt="Add File"
                  className="w-12 h-12 filter invert"
                />
                <span>{selectedFile ? selectedFile.name : "Add File"}</span>
              </div>
              <input
                type="file"
                name="file"
                className="hidden"
                onChange={(event) =>
                  setSelectedFile(event.currentTarget.files?.[0] ?? null)
                }
              />
            </label>
            <label className="flex h-32 flex-1 cursor-pointer items-center justify-center rounded bg-[#5D474D] text-white">
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/folder.svg"
                  alt="Add Folder"
                  className="w-12 h-12 filter invert"
                />
                <span>Add Folder</span>
              </div>
              <input type="file" name="folder" className="hidden" />
            </label>
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className={inputClass}
          />
          <input
            type="text"
            name="title"
            placeholder="Title"
            className={inputClass}
          />
          <input
            type="text"
            name="message"
            placeholder="Message"
            className={inputClass}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className={inputClass}
          />
        </div>
        {statusMessage && (
          <p className="mb-3 text-sm text-zinc-900">{statusMessage}</p>
        )}
        <Button />
        {isSubmitting && <p className="mt-3 text-sm text-zinc-900">Working...</p>}
      </form>
    </div>
  );
};