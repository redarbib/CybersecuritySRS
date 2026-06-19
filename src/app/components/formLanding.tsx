"use client";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useUploadThing } from "@/utils/uploadthing";

type UploadServerData = {
  message?: string;
  downloadPageUrl?: string | null;
  folderName?: string | null;
};

type AuthResponse = {
  message?: string;
};

const MAX_TOTAL_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
type FormLandingProps = {
  isLoggedIn: boolean;
};

function toOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

export default function FormLanding({ isLoggedIn }: FormLandingProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFolderName, setSelectedFolderName] = useState<string | null>(
    null,
  );
  const [lastUploadedFolderName, setLastUploadedFolderName] = useState<
    string | null
  >(null);
  const [statusType, setStatusType] = useState<"success" | "error" | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const { startUpload, isUploading } = useUploadThing("secureFileUploader", {
    onUploadError: (error) => {
      setStatusType("error");
      setStatusMessage(error.message);
    },
  });

  const inputClass =
    "w-full text-black bg-transparent p-2 m-1 border-b border-black outline-none";

  useEffect(() => {
    if (!folderInputRef.current) {
      return;
    }

    folderInputRef.current.setAttribute("webkitdirectory", "");
    folderInputRef.current.setAttribute("directory", "");
  }, []);

  const handleSingleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const chosenFile = event.currentTarget.files?.[0] ?? null;
    setSelectedFiles(chosenFile ? [chosenFile] : []);
    setSelectedFolderName(null);
  };

  const handleFolderSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const chosenFiles = Array.from(event.currentTarget.files ?? []);
    setSelectedFiles(chosenFiles);

    const firstRelativePath = chosenFiles[0]?.webkitRelativePath;
    const detectedFolderName = firstRelativePath
      ? (firstRelativePath.split("/")[0] ?? null)
      : null;
    setSelectedFolderName(detectedFolderName);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = toOptionalString(formData.get("email"));
    const password = toOptionalString(formData.get("password"));
    const title = toOptionalString(formData.get("title"));
    const message = toOptionalString(formData.get("message"));
    const link = toOptionalString(formData.get("link"));
    const expiryDate = toOptionalString(formData.get("expiryDate"));
    const uploadFolderName = selectedFolderName;
    const totalUploadBytes = selectedFiles.reduce(
      (accumulator, currentFile) => accumulator + currentFile.size,
      0,
    );

    setStatusType(null);
    setStatusMessage(null);

    if (selectedFiles.length === 0) {
      setStatusType("error");
      setStatusMessage("Kies eerst een bestand of map.");
      return;
    }

    if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
      setStatusType("error");
      setStatusMessage("Totale upload is te groot. Maximum is 2GB per upload.");
      return;
    }

    if (!isLoggedIn && (!email || !password)) {
      setStatusType("error");
      setStatusMessage("Email en wachtwoord zijn verplicht.");
      return;
    }

    try {
      if (!isLoggedIn) {
        const registerResponse = await fetch("/api/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
        const registerPayload = (await registerResponse.json()) as AuthResponse;

        if (registerResponse.status === 409) {
          const loginResponse = await fetch("/api/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
          });

          const loginPayload = (await loginResponse.json()) as AuthResponse;

          if (!loginResponse.ok) {
            throw new Error(loginPayload.message ?? "Login mislukt.");
          }
        } else if (!registerResponse.ok) {
          throw new Error(registerPayload.message ?? "Registratie mislukt.");
        }
      }

      const uploadResponse = await startUpload(selectedFiles, {
        title,
        message,
        link,
        expiryDate,
        folderName: uploadFolderName ?? undefined,
      });

      if (!uploadResponse || uploadResponse.length === 0) {
        throw new Error("Upload mislukt. Probeer het opnieuw.");
      }

      const serverData = uploadResponse[0]?.serverData as
        | UploadServerData
        | undefined;
      const successMessage = uploadFolderName
        ? `Map "${uploadFolderName}" is succesvol geüpload (${uploadResponse.length} bestanden).`
        : (serverData?.message ??
          `Bestand "${selectedFiles[0]?.name ?? "bestand"}" is succesvol geüpload.`);

      setStatusType("success");
      setStatusMessage(successMessage);
      setLastUploadedFolderName(uploadFolderName);

      form.reset();
      setSelectedFiles([]);
      setSelectedFolderName(null);
      window.location.href = serverData?.downloadPageUrl ?? "/transfer";
    } catch (error) {
      setStatusType("error");
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Upload mislukt. Probeer het opnieuw.",
      );
    }
  };

  return (
    <div className="flex w-full items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl p-8 bg-white rounded-lg"
      >
        <div className="w-full flex flex-col gap-3">
          <div className="flex w-full gap-4">
            <label className="flex h-40 flex-1 cursor-pointer items-center justify-center rounded bg-[#4E3D42] text-white">
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <Image
                  src="/plus.svg"
                  alt="Add file"
                  width={48}
                  height={48}
                  className="filter invert"
                />
                <span className="font-medium">
                  {selectedFolderName
                    ? "Bestand kiezen"
                    : (selectedFiles[0]?.name ?? "Kies bestand")}
                </span>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".png,.mp3,.mp4,.rar,.zip,.csv,.txt,.docx,.pdf"
                onChange={handleSingleFileSelection}
              />
            </label>

            <label className="flex h-40 flex-1 cursor-pointer items-center justify-center rounded bg-[#4E3D42] text-white">
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <Image
                  src="/folder.svg"
                  alt="Add folder"
                  width={48}
                  height={48}
                  className="filter invert"
                />
                <span className="font-medium">
                  {selectedFolderName ?? "Kies map"}
                </span>
                {selectedFolderName && (
                  <span className="text-xs opacity-80">
                    {selectedFiles.length} bestanden geselecteerd
                  </span>
                )}
              </div>
              <input
                ref={folderInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={handleFolderSelection}
              />
            </label>
          </div>

          {!isLoggedIn && (
            <>
              <input
                type="email"
                name="email"
                placeholder="Your email"
                required
                className={inputClass}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                className={inputClass}
              />
            </>
          )}
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

          <div className="flex flex-col">
            <label htmlFor="expiryDate" className="px-2 text-xs text-zinc-600">
              Expiry date
            </label>
            <input
              id="expiryDate"
              type="date"
              name="expiryDate"
              className={inputClass}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="mt-5 text-xl rounded-lg bg-[#4E3D42] p-3 text-white w-full active:bg-[#3A2C30] hover:bg-[#3A2C30] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isUploading ? "Uploading..." : "Transfer"}
        </button>

        {statusMessage && (
          <p
            className={`mt-3 text-sm ${
              statusType === "error" ? "text-red-600" : "text-zinc-900"
            }`}
          >
            {statusMessage}
          </p>
        )}

        {lastUploadedFolderName && (
          <p className="mt-3 text-xs text-zinc-600">
            Laatst geüploade map: {lastUploadedFolderName}
          </p>
        )}
      </form>
    </div>
  );
}
