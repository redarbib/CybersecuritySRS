import Image from "next/image";
import { headers } from "next/headers";
import { isValidSecretHash } from "../../../lib/secretHash";
import FormLanding from "../components/formUpload";
import { getSessionFromServerCookies } from "../../../lib/authSession";
import Navbar from "../components/ui/navbar";

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
};

type DashboardSearchParams = {
  userId?: string | string[];
  code?: string | string[];
  fileId?: string | string[];
};

type TransferProps = {
  searchParams?: Promise<DashboardSearchParams> | DashboardSearchParams;
};

function parseUserId(rawUserId: string | null): number | null {
  if (!rawUserId) return null;

  const parsedValue = Number(rawUserId);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function parseFileId(rawFileId: string | null): number | null {
  if (!rawFileId) return null;

  const parsedValue = Number(rawFileId);
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

async function getFilesFromApi(
  userId: number,
  secretHash: string,
): Promise<{
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

    const fetchUrl = `${protocol}://${host}/api/fetch?userId=${userId}&code=${encodeURIComponent(secretHash)}`;
    const cookieHeader = requestHeaders.get("cookie");
    const response = await fetch(fetchUrl, {
      cache: "no-store",
      headers: cookieHeader ? { cookie: cookieHeader } : undefined,
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
  const requestedSecretHash = getSingleSearchParam(resolvedSearchParams?.code);
  const queryUserId = parseUserId(
    getSingleSearchParam(resolvedSearchParams?.userId),
  );
  const selectedFileId = parseFileId(
    getSingleSearchParam(resolvedSearchParams?.fileId),
  );
  const resolvedUserId = session?.userId ?? queryUserId;
  const hasValidSecretHash = requestedSecretHash
    ? await isValidSecretHash(requestedSecretHash)
    : false;
  const hasSecretAccess = Boolean(
    requestedSecretHash && resolvedUserId && hasValidSecretHash,
  );

  const { files } =
    hasSecretAccess && requestedSecretHash && resolvedUserId
      ? await getFilesFromApi(resolvedUserId, requestedSecretHash)
      : { files: [] };

  const fileCount = files.length;
  const selectedFile =
    files.find((file) => file.Id === selectedFileId) ?? files[0];
  const displayFileName = selectedFile?.FileName ?? "Filenaam.type";
  const displayFileType = selectedFile?.FileType ?? "Type";
  const displayFileSize = formatFileSize(selectedFile?.FileSize ?? null);

  const secureDownloadLink =
    hasSecretAccess && selectedFile && resolvedUserId && requestedSecretHash
      ? `/api/download?fileId=${selectedFile.Id}&userId=${resolvedUserId}&code=${encodeURIComponent(requestedSecretHash)}`
      : "#";

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-[50%_50%]">
      <FormLanding isLoggedIn={Boolean(session)} />

      <section className="bg-[#efefef] text-black p-6">
        <div className="mx-auto max-w-[760px]">
          <Navbar />

          <h1 className="mt-3 text-xl sm:text-3xl leading-tight">
            {displayFileName}
          </h1>

          <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded p-4 border border-[#d6d6d6] bg-white">
              <div className="mt-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xl text-zinc-600 sm:text-2xl leading-tight truncate">
                    {displayFileName}
                  </div>

                  <div className="flex items-center gap-2">
                    <a href={secureDownloadLink} className="inline-flex">
                      <Image
                        src="/download.svg"
                        alt="Download"
                        width={16}
                        height={16}
                      />
                    </a>
                  </div>
                </div>

                <div className="text-sm text-black/65">
                  {displayFileSize} &nbsp; {displayFileType}
                </div>
              </div>
            </div>

            {/* <div className="rounded p-4 border border-[#d6d6d6] bg-white">
              <div className="text-2xl sm:text-3xl leading-tight">
                Extra settings
              </div>

              <div className="mt-2 h-10 flex items-center justify-between text-sm sm:text-base text-black/80">
                <span>No password set</span>
                <Image
                  src="/arrow-down.svg"
                  alt="Expand settings"
                  width={16}
                  height={16}
                />
              </div>
            </div> */}
          </div>
        </div>
      </section>
    </main>
  );
}
