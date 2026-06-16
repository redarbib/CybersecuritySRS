import Link from "next/link";
import { headers } from "next/headers";
import { isValidSecretHash } from "../../../lib/secretHash";

const CURRENT_USER_ID = 1;

type FileOverviewRow = {
  Id: number;
  FileName: string;
  FileType: string | null;
  FileSize: number | null;
};
type MissingFileRow = {
  Id: number;
  FileName: string;
};

type FetchFilesResponse = {
  files?: FileOverviewRow[];
  missingFiles?: MissingFileRow[];
  message?: string;
};

type DownloadPageSearchParams = {
  userId?: string | string[];
  code?: string | string[];
};

type DownloadPageProps = {
  searchParams?: Promise<DownloadPageSearchParams> | DownloadPageSearchParams;
};

function parseUserId(rawUserId: string | null): number | null {
  if (!rawUserId) {
    return null;
  }

  const parsedValue = Number(rawUserId);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function renderAccessDenied() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Toegang geweigerd</h1>
      <p className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
        You have no access to this.
      </p>
      <Link
        href="/"
        className="inline-block rounded border border-zinc-500 px-4 py-2 text-sm"
      >
        Terug naar upload
      </Link>
    </main>
  );
}

// Format fileSize
function formatFileSize(size: number | null): string {
  // If the size does not exist or is 0 return onbekend
  if (!size || size < 0) {
    return "Onbekend";
  }

  // If the size is less than 1024KB return B
  if (size < 1024) {
    return `${size} B`;
  }

  // If the size is less than 1024 times itself return KB
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  // If the size is less than 1024 times itself twice show MB
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Return the size in GB if all the above if statments were not true
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

async function getFilesFromApi(
  userId: number,
  secretHash: string,
): Promise<{
  files: FileOverviewRow[];
  missingFiles: MissingFileRow[];
  errorMessage: string | null;
  accessDenied: boolean;
}> {
  try {
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host) {
      return {
        files: [],
        missingFiles: [],
        errorMessage: "Kon de lijst met bestanden niet ophalen.",
        accessDenied: false,
      };
    }

    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http");
    const response = await fetch(
      `${protocol}://${host}/api/fetch?userId=${userId}&code=${encodeURIComponent(secretHash)}`,
      { cache: "no-store" },
    );
    const payload = (await response.json()) as FetchFilesResponse;

    if (response.status === 403) {
      return {
        files: [],
        missingFiles: [],
        errorMessage: null,
        accessDenied: true,
      };
    }
    if (!response.ok) {
      return {
        files: [],
        missingFiles: [],
        errorMessage:
          payload.message ?? "Kon de lijst met bestanden niet ophalen.",
        accessDenied: false,
      };
    }

    return {
      files: payload.files ?? [],
      missingFiles: payload.missingFiles ?? [],
      errorMessage: null,
      accessDenied: false,
    };
  } catch {
    return {
      files: [],
      missingFiles: [],
      errorMessage: "Kon de lijst met bestanden niet ophalen.",
      accessDenied: false,
    };
  }
}

export default async function DownloadPage({
  searchParams,
}: DownloadPageProps) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedSecretHash = getSingleSearchParam(resolvedSearchParams?.code);
  const requestedUserId = parseUserId(
    getSingleSearchParam(resolvedSearchParams?.userId),
  );
  const hasValidSecretHash = await isValidSecretHash(requestedSecretHash);

  if (
    !requestedSecretHash ||
    !requestedUserId ||
    requestedUserId !== CURRENT_USER_ID ||
    !hasValidSecretHash
  ) {
    return renderAccessDenied();
  }

  const { files, missingFiles, errorMessage, accessDenied } =
    await getFilesFromApi(requestedUserId, requestedSecretHash);

  if (accessDenied) {
    return renderAccessDenied();
  }

  // Return an react page
  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Beschikbare bestanden</h1>

      {errorMessage && (
        <p className="mb-4 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      {!errorMessage && missingFiles.length > 0 && (
        <div className="mb-4 rounded border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">
          <p className="mb-2">Deze bestanden bestaan niet meer:</p>
          <ul className="list-disc pl-5">
            {missingFiles.map((file) => (
              <li key={file.Id}>
                {file.FileName} (ID: {file.Id}) - bestand bestaat niet.
              </li>
            ))}
          </ul>
        </div>
      )}

      {!errorMessage && files.length === 0 && missingFiles.length === 0 && (
        <p className="text-sm text-zinc-400">
          Er zijn nog geen bestanden beschikbaar.
        </p>
      )}

      {!errorMessage && files.length > 0 && (
        <ul className="space-y-3">
          {files.map((file) => {
            const secureDownloadLink = `/api/download?fileId=${file.Id}&userId=${requestedUserId}&code=${encodeURIComponent(requestedSecretHash)}`;

            return (
              <li
                key={file.Id}
                className="flex items-center justify-between rounded border border-zinc-700 p-3"
              >
                <div>
                  <p className="font-medium">{file.FileName}</p>
                  <p className="text-xs text-zinc-400">
                    ID: {file.Id} • Type: {file.FileType ?? "unknown"} •
                    Grootte: {formatFileSize(file.FileSize)}
                  </p>
                </div>

                <a
                  href={secureDownloadLink}
                  className="rounded bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  Download
                </a>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/"
        className="mt-6 inline-block rounded border border-zinc-500 px-4 py-2 text-sm"
      >
        Terug naar upload
      </Link>
    </main>
  );
}
