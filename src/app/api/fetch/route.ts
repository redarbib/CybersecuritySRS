// Fetch one specific file for a shared token
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import pool from "../../../../lib/db";
import { getFileAccessFromToken } from "../../../../lib/fileAccessToken";

type FileListRow = RowDataPacket & {
  Id: number;
  FileName: string;
  FileType: string | null;
  FileSize: number | null;
  FileMessage: string | null;
  FileTitle: string | null;
  PasswordHashFile: string | null;
};

type MissingFileRow = {
  Id: number;
  FileName: string;
};

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
    const fileAccessScope = getFileAccessFromToken(
      requestUrl.searchParams.get("file"),
    );
    if (!fileAccessScope) {
      return NextResponse.json(
        { message: "You have no access to this." },
        { status: 403 },
      );
    }
    const targetUserId = fileAccessScope.userId;
    const targetFileId = fileAccessScope.fileId;

    const [files] = await pool.query<FileListRow[]>(
      `SELECT 
      f.Id,
      f.FileName,
      f.FileType,
      f.FileSize,
      t.Message as FileMessage,
      t.Title as FileTitle,
      t.PasswordHashFile
      FROM files f
      INNER JOIN transfers t ON t.Id = f.TransferId
      WHERE f.Id = ?
      AND t.UserId = ?
      LIMIT 1`,
      [targetFileId, targetUserId],
    );
    if (files.length === 0) {
      return NextResponse.json(
        { message: "You have no access to this." },
        { status: 403 },
      );
    }

    const availableFiles = files.map((file) => ({
      Id: file.Id,
      FileTitle: file.FileTitle,
      FileName: file.FileName,
      FileType: file.FileType,
      FileSize: file.FileSize,
      FileMessage: file.FileMessage,
      HasFilePassword: Boolean(file.PasswordHashFile?.trim()),
    }));

    const missingFiles: MissingFileRow[] = [];

    return NextResponse.json({ files: availableFiles, missingFiles });
  } catch {
    return NextResponse.json(
      { message: "Kon bestanden niet ophalen." },
      { status: 500 },
    );
  }
}
