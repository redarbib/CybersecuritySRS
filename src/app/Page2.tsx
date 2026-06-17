"use client";
import React, { FormEvent, useState } from "react";
import "./globals.css";
import Button from "./components/button";

// Define uploadStatus
type UploadStatus = {
  type: "success" | "error";
  message: string;
} | null;

// Define responsePayLoad
type UploadResponsePayload = {
  message?: string;
  downloadPageUrl?: string | null;
  fileDownloadUrl?: string | null;
};

// Define protectedDownloadLinks
type ProtectedDownloadLinks = {
  downloadPageUrl: string;
  fileDownloadUrl: string;
} | null;

export default function UploadFilePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>(null);
  const [protectedLinks, setProtectedLinks] =
    useState<ProtectedDownloadLinks>(null);
  const [copyStatusMessage, setCopyStatusMessage] = useState<string | null>(
    null,
  );

  // function so that users can copy their download link
  const copyLinkToClipboard = async (link: string, label: string) => {
    try {
      const absoluteLink = new URL(link, window.location.origin).toString();
      await navigator.clipboard.writeText(absoluteLink);
      setCopyStatusMessage(`${label} link gekopieerd.`);
    } catch {
      setCopyStatusMessage("Kopiëren mislukt. Probeer handmatig te kopiëren.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;

    // If no file is chosen give this error status
    if (!selectedFile) {
      setStatus({
        type: "error",
        message: "Kies eerst een bestand.",
      });
      return;
    }

    // Bind uploading naar true en status naar null
    setIsUploading(true);
    setStatus(null);
    setProtectedLinks(null);
    setCopyStatusMessage(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    // Try response with POST and body with formData
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as UploadResponsePayload;

      // If theree is no json response throw new error
      if (!response.ok) {
        throw new Error(payload.message ?? "Upload mislukt.");
      }

      // If everything above went correct show this succes status
      setStatus({
        type: "success",
        message: payload.message ?? "Bestand succesvol geüpload.",
      });
      if (payload.downloadPageUrl && payload.fileDownloadUrl) {
        setProtectedLinks({
          downloadPageUrl: payload.downloadPageUrl,
          fileDownloadUrl: payload.fileDownloadUrl,
        });
      }
      formElement.reset();
      setSelectedFile(null);
      // If there was an error in runtime show error status
    } catch (error) {
      setProtectedLinks(null);
      setCopyStatusMessage(null);
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Upload mislukt.",
      });
    } finally {
      // Bind uploading to false everything finished
      setIsUploading(false);
    }
  };

  // Return an react page
  return (
    <main className="mx-auto max-w-xl p-6">
      <Button /> 
      <h1 className="text-2xl font-semibold mb-4">Bestand uploaden</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="file"
          name="file"
          onChange={(event) =>
            setSelectedFile(event.currentTarget.files?.[0] ?? null)
          }
          required
          className="border rounded p-2"
        />

        <button
          type="submit"
          disabled={isUploading}
          className="rounded bg-white px-4 py-2 text-zinc-900 disabled:opacity-60"
        >
          {isUploading ? "Uploaden..." : "Bestand versturen"}
        </button>
      </form>

      {/* Show the status type */}
      {status && (
        <p
          className={`mt-4 text-sm ${
            status.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {status.message}
        </p>
      )}
      {protectedLinks && (
        <div className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-2">
            <a
              href={protectedLinks.downloadPageUrl}
              className="inline-block rounded border border-zinc-500 px-4 py-2"
            >
              Naar downloadpagina
            </a>
            <button
              type="button"
              onClick={() =>
                copyLinkToClipboard(
                  protectedLinks.downloadPageUrl,
                  "Downloadpagina",
                )
              }
              className="rounded border border-zinc-500 px-4 py-2"
            >
              Kopieer link
            </button>
          </div>
          {copyStatusMessage && <p>{copyStatusMessage}</p>}
        </div>
      )}
    </main>
  );
}
