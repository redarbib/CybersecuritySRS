"use client";
import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useUploadThing } from "@/utils/uploadthing";

type UploadServerData = {
  message?: string;
  filePassword?: string | null;
  downloadPageUrl?: string | null;
  folderName?: string | null;
};

type AuthResponse = {
  message?: string;
};

// Define max upload in bytes which is 128MB
const MAX_TOTAL_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_TITLE_LENGTH = 50;
const MAX_MESSAGE_LENGTH = 100;
const MAX_FILE_PASSWORD_LENGTH = 255;
const MAX_EMAIL_LENGTH = 255;
const MAX_PASSWORD_LENGTH = 255;

// Define default error message
const DEFAULT_UPLOAD_ERROR_MESSAGE = "Upload mislukt. Probeer het opnieuw.";

// Define allowed file types
const ALLOWED_FILE_TYPES = new Set([
  "png",
  "mp3",
  "mp4",
  "rar",
  "zip",
  "csv",
  "docx",
  "pdf",
]);

// Define allowed file types label
const ALLOWED_FILE_TYPES_LABEL = "png, mp3, mp4, rar, zip, csv, docx, pdf";

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

function extractErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (!error || typeof error !== "object") {
    return fallbackMessage;
  }

  const errorObject = error as {
    message?: unknown;
    data?: unknown;
    cause?: unknown;
  };

  if (typeof errorObject.message === "string" && errorObject.message.trim()) {
    return errorObject.message;
  }

  if (typeof errorObject.cause === "string" && errorObject.cause.trim()) {
    return errorObject.cause;
  }

  if (errorObject.data && typeof errorObject.data === "object") {
    const data = errorObject.data as {
      message?: unknown;
      issues?: unknown;
      zodError?: unknown;
    };

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (Array.isArray(data.issues) && data.issues.length > 0) {
      const firstIssue = data.issues[0] as { message?: unknown } | undefined;
      if (firstIssue && typeof firstIssue.message === "string") {
        return firstIssue.message;
      }
    }

    if (data.zodError && typeof data.zodError === "object") {
      const zodError = data.zodError as { issues?: unknown };
      if (Array.isArray(zodError.issues) && zodError.issues.length > 0) {
        const firstIssue = zodError.issues[0] as
          | { message?: unknown }
          | undefined;
        if (firstIssue && typeof firstIssue.message === "string") {
          return firstIssue.message;
        }
      }
    }
  }

  return fallbackMessage;
}

function getFileExtension(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return "";
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase();
}

function getFirstDisallowedFile(files: File[]): File | null {
  return (
    files.find(
      (currentFile) =>
        !ALLOWED_FILE_TYPES.has(getFileExtension(currentFile.name)),
    ) ?? null
  );
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
      setStatusMessage(
        extractErrorMessage(error, DEFAULT_UPLOAD_ERROR_MESSAGE),
      );
    },
  });

  const inputClass =
    "w-full text-black bg-transparent pb-2 pt-2 border-b border-black outline-none";

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
    const chosenFiles = Array.from(event.currentTarget.files ?? []);
    const chosenFile = chosenFiles[0] ?? null;
    if (!chosenFile) {
      setSelectedFiles([]);
      setSelectedFolderName(null);
      return;
    }

    const disallowedFile = getFirstDisallowedFile([chosenFile]);

    // If an user uploads an file that is not allowed show an message and stop the upload
    if (disallowedFile) {
      setSelectedFiles([]);
      setSelectedFolderName(null);
      setStatusType("error");
      setStatusMessage(
        `Bestandstype niet toegestaan: \"${disallowedFile.name}\". Bestandtypes die zijn toegestaan: ${ALLOWED_FILE_TYPES_LABEL}.`,
      );
      event.currentTarget.value = "";
      return;
    }

    setSelectedFiles([chosenFile]);
    setSelectedFolderName(null);
    setStatusType(null);
    setStatusMessage(null);
  };

  const handleFolderSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const chosenFiles = Array.from(event.currentTarget.files ?? []);
    if (chosenFiles.length === 0) {
      setSelectedFiles([]);
      setSelectedFolderName(null);
      return;
    }

    const disallowedFile = getFirstDisallowedFile(chosenFiles);
    if (disallowedFile) {
      setSelectedFiles([]);
      setSelectedFolderName(null);
      setStatusType("error");
      setStatusMessage(
        `Bestandstype niet toegestaan: \"${disallowedFile.name}\". Bestandtypes die zijn toegestaan: ${ALLOWED_FILE_TYPES_LABEL}.`,
      );
      event.currentTarget.value = "";
      return;
    }
    setSelectedFiles(chosenFiles);

    const firstRelativePath = chosenFiles[0]?.webkitRelativePath;
    const detectedFolderName = firstRelativePath
      ? (firstRelativePath.split("/")[0] ?? null)
      : null;
    setSelectedFolderName(detectedFolderName);
    setStatusType(null);
    setStatusMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = toOptionalString(formData.get("email"));
    const password = toOptionalString(formData.get("password"));
    const filePassword = toOptionalString(formData.get("filePassword"));
    const title = toOptionalString(formData.get("title"));
    const message = toOptionalString(formData.get("message"));
    const uploadFolderName = selectedFolderName;
    const totalUploadBytes = selectedFiles.reduce(
      (accumulator, currentFile) => accumulator + currentFile.size,
      0,
    );

    setStatusType(null);
    setStatusMessage(null);

    // If an user tries to upload nothing
    if (selectedFiles.length === 0) {
      setStatusType("error");
      setStatusMessage("Kies eerst een bestand of map.");
      return;
    }

    const disallowedFile = getFirstDisallowedFile(selectedFiles);
    if (disallowedFile) {
      setStatusType("error");
      setStatusMessage(
        `Bestandstype niet toegestaan: \"${disallowedFile.name}\". Toegestaan: ${ALLOWED_FILE_TYPES_LABEL}.`,
      );
      return;
    }

    if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
      setStatusType("error");
      setStatusMessage(
        "Totale upload is te groot. Maximum is 128MB per upload.",
      );
      return;
    }

    if (!isLoggedIn && (!email || !password)) {
      setStatusType("error");
      setStatusMessage("Email en wachtwoord zijn verplicht.");
      return;
    }

    if (!isLoggedIn && email && email.length > MAX_EMAIL_LENGTH) {
      setStatusType("error");
      setStatusMessage("Email mag maximaal 255 tekens bevatten.");
      return;
    }

    if (!isLoggedIn && password && password.length > MAX_PASSWORD_LENGTH) {
      setStatusType("error");
      setStatusMessage("Wachtwoord mag maximaal 255 tekens bevatten.");
      return;
    }

    if (title && title.length > MAX_TITLE_LENGTH) {
      setStatusType("error");
      setStatusMessage("Titel mag maximaal 50 tekens bevatten.");
      return;
    }

    if (message && message.length > MAX_MESSAGE_LENGTH) {
      setStatusType("error");
      setStatusMessage("Bericht mag maximaal 100 tekens bevatten.");
      return;
    }

    if (filePassword && filePassword.length > MAX_FILE_PASSWORD_LENGTH) {
      setStatusType("error");
      setStatusMessage("Bestandswachtwoord mag maximaal 100 tekens bevatten.");
      return;
    }

    // If an user is not logged in send him to the register route
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

        // If the account already exists route the user to login
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
        filePassword,
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
        extractErrorMessage(error, DEFAULT_UPLOAD_ERROR_MESSAGE),
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
                accept=".png,.mp3,.mp4,.rar,.zip,.csv,.txt,.docx,.pdf"
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
                maxLength={MAX_EMAIL_LENGTH}
                className={inputClass}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                maxLength={MAX_PASSWORD_LENGTH}
                className={inputClass}
              />
            </>
          )}
          <input
            type="text"
            name="title"
            placeholder="Title"
            maxLength={MAX_TITLE_LENGTH}
            className={inputClass}
          />
          <input
            type="text"
            name="message"
            placeholder="Message"
            maxLength={MAX_MESSAGE_LENGTH}
            className={inputClass}
          />
          <input
            type="password"
            name="filePassword"
            placeholder="File password (optional)"
            maxLength={MAX_FILE_PASSWORD_LENGTH}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="mt-5 text-xl rounded-lg bg-[#4E3D42] p-3 text-white w-full active:bg-[#3A2C30] hover:bg-[#3A2C30] hover:cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
