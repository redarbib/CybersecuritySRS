import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { RowDataPacket } from "mysql2/promise";
import pool from "../../../../lib/db";
import { isValidSecretHash } from "../../../../lib/secretHash";

// Default user_id to 1 for the moment
const CURRENT_USER_ID = 1;

type FileListRow = RowDataPacket & {
  Id: number;
  FileName: string;
  FileType: string | null;
  FileSize: number | null;
  StorageUrl: string | null;
};

type MissingFileRow = {
  Id: number;
  FileName: string;
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

function isSecureRequest(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  const requestUrl = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return requestUrl.protocol === "https:" || forwardedProto === "https";
}

export async function GET(request: Request) {
  try {
    if (!isSecureRequest(request)) {
      return NextResponse.json(
        { message: "Beveiligde verbinding vereist (HTTPS)." },
        { status: 403 },
      );
    }
    const requestUrl = new URL(request.url);
    const requestedSecretHash = requestUrl.searchParams.get("code");
    const hasValidSecretHash = await isValidSecretHash(requestedSecretHash);
    const requestedUserId = parseUserId(requestUrl.searchParams.get("userId"));

    if (
      !requestedSecretHash ||
      !hasValidSecretHash ||
      !requestedUserId ||
      requestedUserId !== CURRENT_USER_ID
    ) {
      return NextResponse.json(
        { message: "You have no access to this." },
        { status: 403 },
      );
    }
    const [files] = await pool.query<FileListRow[]>(
      `SELECT f.Id, f.FileName, f.FileType, f.FileSize, f.StorageUrl
       FROM files f
       INNER JOIN transfers t ON t.Id = f.TransferId
       WHERE t.UserId = ?
       ORDER BY f.Id DESC`,
      [requestedUserId],
    );
    const filesWithAvailability = await Promise.all(
      files.map(async (file) => {
        const storedFileName = path.basename(file.StorageUrl ?? "");
        if (!storedFileName) {
          return { existsOnDisk: false, file };
        }

        const absoluteFilePath = path.join(process.cwd(), "uploads", storedFileName);

        try {
          await fs.access(absoluteFilePath);
          return { existsOnDisk: true, file };
        } catch {
          return { existsOnDisk: false, file };
        }
      }),
    );

    const availableFiles = filesWithAvailability
      .filter((entry) => entry.existsOnDisk)
      .map((entry) => ({
        Id: entry.file.Id,
        FileName: entry.file.FileName,
        FileType: entry.file.FileType,
        FileSize: entry.file.FileSize,
      }));

    const missingFiles: MissingFileRow[] = filesWithAvailability
      .filter((entry) => !entry.existsOnDisk)
      .map((entry) => ({
        Id: entry.file.Id,
        FileName: entry.file.FileName || `Bestand ${entry.file.Id}`,
      }));

    return NextResponse.json({ files: availableFiles, missingFiles });
  } catch (err) {
    console.error("ERROR: API - fetch", (err as Error).message);
    return NextResponse.json(
      { message: "Kon bestanden niet ophalen." },
      { status: 500 },
    );
  }
}
