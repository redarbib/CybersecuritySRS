"use client";
import React, { FormEvent, useState } from "react";
import "./globals.css";
import Navbar from "./components/ui/navbar";
import FormLanding from "./components/formLanding";

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

  // Refractored the code now in page2.tsx
  return (
    <div className="h-screen flex flex-col">
      <div className="w-full flex justify-end px-12 pt-4 shrink-0">
        <Navbar />
      </div>

      <div className="flex flex-1 items-center gap-12 px-12 overflow-hidden">
        <div className="w-1/2 flex justify-center items-center">
          <FormLanding />
        </div>

        <div className="w-1/2 flex justify-center items-center">
          <div className="text-center">
            <h1 className="font-extrabold text-6xl text-zinc-900 text-left">
              <span>Serious Files</span>
              <br />
              <span>Secured Transfers</span>
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}