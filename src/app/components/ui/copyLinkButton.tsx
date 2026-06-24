"use client";
import { useEffect, useState } from "react";

type CopyStatus = "idle" | "success" | "error";

export default function CopyPageLinkButton() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  async function handleCopyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  useEffect(() => {
    if (copyStatus === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyStatus("idle");
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copyStatus]);

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopyLink}
        className="rounded border border-[#d6d6d6] text-sky-600 bg-white px-3 py-1 text-xs sm:text-sm hover:bg-black/[0.04] hover:cursor-pointer"
      >
        Copy link
      </button>

      {copyStatus === "success" && (
        <span className="text-xs text-green-700">Link copied</span>
      )}
      {copyStatus === "error" && (
        <span className="text-xs text-red-600">Copy failed</span>
      )}
    </div>
  );
}
