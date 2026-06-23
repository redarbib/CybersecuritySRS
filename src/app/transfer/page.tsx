import Image from "next/image";
import { headers } from "next/headers";
import {
  createFileAccessToken,
  getFileAccessFromToken,
} from "../../../lib/fileAccessToken";
import FormLanding from "../components/formUpload";
import { getSessionFromServerCookies } from "../../../lib/authSession";
import Navbar from "../components/ui/navbar";

type FileOverviewRow = {
  Id: number;
  FileTitle: string;
  FileName: string;
  FileType: string | null;
  FileSize: number | null;
  FileMessage: string | null;
  HasFilePassword: boolean;
};

type MissingFileRow = {
  Id: number;
  FileName: string;
};

type FetchFilesResponse = {
  files?: FileOverviewRow[];
  missingFiles?: MissingFileRow[];
};

type DashboardSearchParams = {
  file?: string | string[];
};

type TransferProps = {
  searchParams?: Promise<DashboardSearchParams> | DashboardSearchParams;
};

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function formatFileSize(size: number | null): string {
  // If the file is false or less than 0 return Unknown
  if (!size || size < 0) return "Unknown";

  // If the file is less than 1024 bytes return B
  if (size < 1024) return `${size} B`;

  // If the file is less than 1024 times 1024 return size divided by 1024 in a string in KB
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;

  // If the file is less than 1024 times 1024 twice then return size divided by 1024 times 1024 in a string in mb
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  // If all the above are false return GB
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

async function getFilesFromApi(fileAccessToken: string): Promise<{
  files: FileOverviewRow[];
  missingFiles: MissingFileRow[];
}> {
  try {
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    if (!host) {
      return { files: [], missingFiles: [] };
    }

    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http");

    const fetchUrl = `${protocol}://${host}/api/fetch?file=${encodeURIComponent(fileAccessToken)}`;
    const response = await fetch(fetchUrl, {
      cache: "no-store",
    });

    if (!response.ok) {
      return { files: [], missingFiles: [] };
    }

    const payload = (await response.json()) as FetchFilesResponse;

    return {
      files: payload.files ?? [],
      missingFiles: payload.missingFiles ?? [],
    };
  } catch {
    return { files: [], missingFiles: [] };
  }
}

export default async function Transfer({ searchParams }: TransferProps) {
  const session = await getSessionFromServerCookies();
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const requestedFileToken = getSingleSearchParam(resolvedSearchParams?.file);
  const fileAccessScope = getFileAccessFromToken(requestedFileToken);
  const hasTokenAccess = Boolean(fileAccessScope && requestedFileToken);
  const { files } =
    hasTokenAccess && requestedFileToken
      ? await getFilesFromApi(requestedFileToken)
      : { files: [] };
  const selectedFile = files[0];
  const displayFileTitle = selectedFile?.FileTitle ?? "Filetitel";
  const displayFileName = selectedFile?.FileName ?? "Filenaam";
  const displayFileMessage = selectedFile?.FileMessage ?? "Filedescription";
  const displayFileType = selectedFile?.FileType ?? "";
  const displayFileSize = formatFileSize(selectedFile?.FileSize ?? null);
  const hasFilePassword = Boolean(selectedFile?.HasFilePassword);
  const passwordStatusText = !selectedFile
    ? "No files uploaded"
    : hasFilePassword
      ? "Password required for download"
      : "No password set";

  const downloadToken =
    selectedFile && fileAccessScope
      ? createFileAccessToken(selectedFile.Id, fileAccessScope.userId)
      : null;
  const secureDownloadLink = downloadToken
    ? `/api/download?file=${encodeURIComponent(downloadToken)}`
    : "#";

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[50%_50%]">
      <FormLanding isLoggedIn={Boolean(session)} />

      <section className="bg-[#efefef] text-black p-6">
        <div className="mx-auto max-w-[760px]">
          <Navbar />

          <h1 className="mt-3 text-xl sm:text-3xl leading-tight">
            {displayFileTitle}
          </h1>

          <div className="flex gap-2">
            <p>{displayFileMessage}</p>
          </div>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded p-4 border border-[#d6d6d6] bg-white">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xl text-zinc-600 sm:text-2xl leading-tight truncate">
                    {displayFileName}
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedFile &&
                      (hasFilePassword ? (
                        <form
                          action="/api/download"
                          method="GET"
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="file"
                            value={downloadToken ?? ""}
                          />
                          <input
                            type="password"
                            name="password"
                            placeholder="File password"
                            required
                            maxLength={255}
                            className="h-8 w-36 rounded border border-zinc-300 px-2 text-sm"
                          />
                          <button
                            type="submit"
                            className="inline-flex cursor-pointer"
                          >
                            <Image
                              src="/download.svg"
                              alt="Download"
                              width={16}
                              height={16}
                            />
                          </button>
                        </form>
                      ) : (
                        <a href={secureDownloadLink} className="inline-flex">
                          <Image
                            src="/download.svg"
                            alt="Download"
                            width={16}
                            height={16}
                          />
                        </a>
                      ))}
                  </div>
                </div>

                <div className="text-sm text-black/65">
                  {displayFileSize} &nbsp; {displayFileType}
                </div>
                <div className="mt-2 text-xs text-black/70">
                  {passwordStatusText}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
