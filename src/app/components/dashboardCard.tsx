import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { RowDataPacket } from "mysql2/promise";
import pool from "../../../lib/db";
import { createFileAccessToken } from "../../../lib/fileAccessToken";
import { getSessionFromServerCookies } from "../../../lib/authSession";
import Navbar from "./ui/navbar";

type DashboardCardProps = {
  email: string | null;
  userId: number | null;
  searchQuery: string;
};

type DashboardFileRow = RowDataPacket & {
  Id: number;
  TransferId: number;
  FileName: string;
  FileTitle: string | null;
  FileType: string | null;
  FileSize: number | null;
};
const MAX_DASHBOARD_SEARCH_LENGTH = 255;

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

const DashboardCard = async ({
  email,
  userId,
  searchQuery,
}: DashboardCardProps) => {
  // If the email or userId is missing return this page, but if these are true show the other page found below
  if (!email || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Not logged in</p>
      </div>
    );
  }

  const normalizedSearchQuery = searchQuery
    .trim()
    .slice(0, MAX_DASHBOARD_SEARCH_LENGTH);
  const searchFilter = `%${normalizedSearchQuery}%`;

  async function deleteTransferAction(formData: FormData): Promise<void> {
    "use server";

    const session = await getSessionFromServerCookies();
    if (!session) {
      return;
    }

    const transferId = Number(formData.get("transferId"));
    if (!Number.isInteger(transferId) || transferId <= 0) {
      return;
    }

    // Delete query
    await pool.execute(
      `DELETE FROM transfers
       WHERE Id = ?
       AND UserId = ?`,
      [transferId, session.userId],
    );

    revalidatePath("/dashboard");
  }

  // Select files and use inner join to determine transfer id where user id and order by date newest
  const [files] = normalizedSearchQuery
    ? await pool.query<DashboardFileRow[]>(
        `SELECT
          f.Id,
          t.Id AS TransferId,
          f.FileName,
          f.FileType,
          f.FileSize,
          t.Title as FileTitle
         FROM files f
         INNER JOIN transfers t ON t.Id = f.TransferId
         WHERE t.UserId = ?
         AND (
           COALESCE(t.Title, '') LIKE ?
           OR COALESCE(f.FileName, '') LIKE ?
           OR COALESCE(f.FileType, '') LIKE ?
         )
         ORDER BY f.Id DESC`,
        [userId, searchFilter, searchFilter, searchFilter],
      )
    : await pool.query<DashboardFileRow[]>(
        `SELECT
          f.Id,
          t.Id AS TransferId,
          f.FileName,
          f.FileType,
          f.FileSize,
          t.Title as FileTitle
         FROM files f
         INNER JOIN transfers t ON t.Id = f.TransferId
         WHERE t.UserId = ?
         ORDER BY f.Id DESC`,
        [userId],
      );

  const filesWithAccessLink = files
    .map((file) => {
      const fileAccessToken = createFileAccessToken(file.Id, userId);
      if (!fileAccessToken) {
        return null;
      }

      return {
        ...file,
        transferUrl: `/transfer?file=${encodeURIComponent(fileAccessToken)}`,
      };
    })
    .filter(
      (file): file is DashboardFileRow & { transferUrl: string } =>
        file !== null,
    );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="min-h-screen w-full bg-[#efefef] p-6 text-black">
        <Navbar />

        <div>
          <h1 className="mt-3 mb-3 text-3xl leading-7">
            Hello <span className="font-light text-[#666666]">{email}</span>
          </h1>

          <form
            action="/dashboard"
            method="GET"
            className="flex h-10 bg-white items-center gap-2 rounded-md border border-[#d6d6d6] px-3"
          >
            <button type="submit" className="inline-flex items-center">
              <Image
                src="/search.svg"
                alt=""
                width={16}
                height={16}
                aria-hidden="true"
              />
              <span className="sr-only">Search transfers</span>
            </button>
            <input
              type="search"
              name="q"
              defaultValue={normalizedSearchQuery}
              maxLength={MAX_DASHBOARD_SEARCH_LENGTH}
              placeholder="Search by title"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-black"
            />
          </form>
          {normalizedSearchQuery && (
            <Link
              href="/dashboard"
              className="mt-1 inline-block text-xs text-[#666666] hover:underline"
            >
              Clear search
            </Link>
          )}

          <h2 className="mt-3 mb-2 text-xl leading-6">Transfers</h2>

          {filesWithAccessLink.length === 0 ? (
            <p className="mt-2 text-sm text-[#666666]">
              {normalizedSearchQuery
                ? `No transfers found for "${normalizedSearchQuery}".`
                : "No transfers made yet."}
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {filesWithAccessLink.map((file) => (
                <article
                  key={file.Id}
                  className="flex min-h-16 bg-white items-center justify-between rounded-md border border-[#d6d6d6] px-3 py-2 transition-colors hover:bg-black/[0.03]"
                >
                  <Link href={file.transferUrl} className="min-w-0 flex-1">
                    <div className="min-w-0">
                      <h3 className="text-lg mb-1 leading-7">
                        {file.FileTitle ?? "Untitled transfer"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-4 text-[#666666]">
                        <span>{formatFileSize(file.FileSize)}</span>
                        <span>{file.FileType ?? "Unknown"}</span>
                      </div>
                    </div>
                  </Link>

                  <form action={deleteTransferAction} className="ml-3">
                    <input
                      type="hidden"
                      name="transferId"
                      value={file.TransferId}
                    />
                    <button
                      type="submit"
                      className="inline-flex h-8 w-8 items-center justify-center rounded border border-[#d6d6d6] bg-white hover:bg-black/[0.04] hover:cursor-pointer"
                    >
                      <Image
                        src="/trash.svg"
                        alt="Delete transfer"
                        width={14}
                        height={14}
                      />
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default DashboardCard;
