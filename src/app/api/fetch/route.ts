// List all files for an user
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import pool from "../../../../lib/db";
import { isValidSecretHash } from "../../../../lib/secretHash";
import { getSessionFromCookieHeader } from "../../../../lib/authSession";

type FileListRow = RowDataPacket & {
  Id: number;
  FileName: string;
  FileType: string | null;
  FileSize: number | null;
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
    const hasValidSecretHash = requestedSecretHash
      ? await isValidSecretHash(requestedSecretHash)
      : false;
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    const requestedUserId = parseUserId(requestUrl.searchParams.get("userId"));
    const targetUserId = requestedUserId ?? session?.userId ?? null;
    const hasSecretAccess = Boolean(
      requestedSecretHash && hasValidSecretHash && targetUserId,
    );
    if (!hasSecretAccess) {
      return NextResponse.json(
        { message: "You have no access to this." },
        { status: 403 },
      );
    }

    const [files] = await pool.query<FileListRow[]>(
      `SELECT f.Id, f.FileName, f.FileType, f.FileSize
       FROM files f
       INNER JOIN transfers t ON t.Id = f.TransferId
       WHERE t.UserId = ?
       ORDER BY f.Id DESC`,
      [targetUserId],
    );

    const availableFiles = files.map((file) => ({
      Id: file.Id,
      FileName: file.FileName,
      FileType: file.FileType,
      FileSize: file.FileSize,
    }));

    const missingFiles: MissingFileRow[] = [];

    return NextResponse.json({ files: availableFiles, missingFiles });
  } catch (err) {
    return NextResponse.json(
      { message: "Kon bestanden niet ophalen." },
      { status: 500 },
    );
  }
}
