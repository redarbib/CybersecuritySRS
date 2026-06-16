import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import pool from "../../../../lib/db";
import { isValidSecretHash } from "../../../../lib/secretHash";

const CURRENT_USER_ID = 1;

type FileRow = RowDataPacket & {
  Id: number;
  UserId: number;
  FileName: string | null;
  StorageUrl: string | null;
};

function parseFileId(rawFileId: string | null): number | null {
  if (!rawFileId) {
    return null;
  }

  const parsedValue = Number(rawFileId);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

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

function resolveContentType(fileName: string): string {
  const extension = path.extname(fileName).toLowerCase();
  switch (extension) {
    case ".pdf":
      return "application/pdf";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".csv":
      return "text/csv; charset=utf-8";
    case ".zip":
      return "application/zip";
    case ".mp3":
      return "audio/mpeg";
    case ".mp4":
      return "video/mp4";
    case ".docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case ".rar":
      return "application/vnd.rar";
    default:
      return "application/octet-stream";
  }
}

function isSecureRequest(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const requestUrl = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return requestUrl.protocol === "https:" || forwardedProto === "https";
}

export const runtime = "nodejs";

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

    const fileId = parseFileId(requestUrl.searchParams.get("fileId"));
    if (!fileId) {
      return NextResponse.json(
        { message: "Ongeldig of ontbrekend fileId." },
        { status: 400 },
      );
    }

    const [files] = await pool.query<FileRow[]>(
      `SELECT f.Id, f.FileName, f.StorageUrl, t.UserId
       FROM files f
       INNER JOIN transfers t ON t.Id = f.TransferId
       WHERE f.Id = ?
       AND t.UserId = ?
       LIMIT 1`,
      [fileId, requestedUserId],
    );

    const targetFile = files[0];
    if (!targetFile || Number(targetFile.UserId) !== CURRENT_USER_ID) {
      return NextResponse.json(
        { message: "You have no access to this." },
        { status: 403 },
      );
    }

    const storedFileName = path.basename(targetFile.StorageUrl ?? "");
    if (!storedFileName) {
      return NextResponse.json(
        { message: "Bestand bestaat niet." },
        { status: 404 },
      );
    }

    const absoluteFilePath = path.join(process.cwd(), "uploads", storedFileName);

    try {
      await fs.access(absoluteFilePath);
    } catch {
      return NextResponse.json(
        { message: "Bestand bestaat niet." },
        { status: 404 },
      );
    }

    const fileBuffer = await fs.readFile(absoluteFilePath);
    const downloadName =
      targetFile.FileName && targetFile.FileName.trim()
        ? targetFile.FileName
        : storedFileName;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": resolveContentType(downloadName),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ERROR: API - download", (error as Error).message);
    return NextResponse.json(
      { message: "Download mislukt. Probeer het opnieuw." },
      { status: 500 },
    );
  }
}
