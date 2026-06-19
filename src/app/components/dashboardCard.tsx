import Image from "next/image";
import Link from "next/link";
import { RowDataPacket } from "mysql2/promise";
import pool from "../../../lib/db";
import { resolveExpectedSecretHash } from "../../../lib/secretHash";
import Navbar from "./ui/navbar";

type DashboardCardProps = {
  email: string | null;
  userId: number | null;
};
type DashboardFileRow = RowDataPacket & {
  Id: number;
  FileName: string;
  FileType: string | null;
  FileSize: number | null;
};

function formatFileSize(size: number | null): string {
  if (!size || size < 0) return "1 MB";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const DashboardCard = async ({ email, userId }: DashboardCardProps) => {
  if (!email || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Not logged in</p>
      </div>
    );
  }
  const [files] = await pool.query<DashboardFileRow[]>(
    `SELECT f.Id, f.FileName, f.FileType, f.FileSize
     FROM files f
     INNER JOIN transfers t ON t.Id = f.TransferId
     WHERE t.UserId = ?
     ORDER BY f.Id DESC`,
    [userId],
  );
  const secretHash = await resolveExpectedSecretHash();

  return (
    <div className="flex min-h-screen w-full">
      <aside className="min-h-screen w-full border-l border-black/15 bg-[#efefef] p-6 text-black">
        <Navbar />

        <div>
          <h1 className="mt-3 mb-3 text-3xl leading-7">
            Hello <span className="font-light text-[#666666]">{email}</span>
          </h1>

          <label className="flex h-10 items-center gap-2 rounded-md border border-black/15 px-3">
            <Image
              src="/search.svg"
              alt=""
              width={16}
              height={16}
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by title"
              className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-black"
            />
          </label>

          <h2 className="mt-3 text-lg leading-6">Dashboard</h2>

          {files.length === 0 ? (
            <p className="mt-2 text-sm text-[#666666]">No files uploaded yet.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {files.map((file) => (
                <Link
                  key={file.Id}
                  href={
                    secretHash
                      ? `/transfer?fileId=${file.Id}&userId=${userId}&code=${encodeURIComponent(secretHash)}`
                      : `/transfer?fileId=${file.Id}`
                  }
                  className="block rounded-md"
                >
                  <article className="flex min-h-16 items-center justify-between rounded-md border border-[#d6d6d6] px-3 py-2 transition-colors hover:bg-black/[0.03]">
                    <div className="min-w-0">
                      <h3 className="text-[24px] mb-1 leading-7">
                        {file.FileName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-4 text-[#666666]">
                        <span>{formatFileSize(file.FileSize)}</span>
                        <span>{file.FileType ?? "unknown"}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default DashboardCard;
