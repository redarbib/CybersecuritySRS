// This is used to download 1 specific file
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import bcrypt from "bcrypt";
import pool from "../../../../lib/db";
import { getFileAccessFromToken } from "../../../../lib/fileAccessToken";

type FileRow = RowDataPacket & {
  Id: number;
  UserId: number;
  StorageUrl: string | null;
  PasswordHashFile: string | null;
};

function isTrustedStorageUrl(storageUrl: string): boolean {
  try {
    const parsedUrl = new URL(storageUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    return hostname.endsWith("utfs.io") || hostname.endsWith("ufs.sh");
  } catch {
    return false;
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
    const fileAccessScope = getFileAccessFromToken(
      requestUrl.searchParams.get("file"),
    );
    if (!fileAccessScope) {
      return NextResponse.json(
        { message: "You have no access to this." },
        { status: 403 },
      );
    }

    const fileId = fileAccessScope.fileId;
    const targetUserId = fileAccessScope.userId;

    const [files] = await pool.query<FileRow[]>(
      `SELECT f.Id, f.StorageUrl, t.UserId, t.PasswordHashFile
       FROM files f
       INNER JOIN transfers t ON t.Id = f.TransferId
       WHERE f.Id = ?
       AND t.UserId = ?
       LIMIT 1`,
      [fileId, targetUserId],
    );

    const targetFile = files[0];
    if (!targetFile || Number(targetFile.UserId) !== targetUserId) {
      return NextResponse.json(
        { message: "You have no access to this." },
        { status: 403 },
      );
    }

    if (!targetFile.StorageUrl) {
      return NextResponse.json(
        { message: "Bestand bestaat niet." },
        { status: 404 },
      );
    }

    const passwordHashFile = targetFile.PasswordHashFile?.trim();
    if (passwordHashFile) {
      const providedPassword = requestUrl.searchParams.get("password")?.trim();
      if (!providedPassword) {
        return NextResponse.json(
          { message: "Bestandswachtwoord is verplicht." },
          { status: 401 },
        );
      }

      if (providedPassword.length > 255) {
        return NextResponse.json(
          { message: "Bestandswachtwoord mag maximaal 255 tekens bevatten." },
          { status: 400 },
        );
      }

      const isValidFilePassword = await bcrypt.compare(
        providedPassword,
        passwordHashFile,
      );
      if (!isValidFilePassword) {
        return NextResponse.json(
          { message: "Onjuist bestandswachtwoord." },
          { status: 403 },
        );
      }
    }

    if (!isTrustedStorageUrl(targetFile.StorageUrl)) {
      return NextResponse.json(
        { message: "Ongeldige storage URL." },
        { status: 400 },
      );
    }

    return NextResponse.redirect(targetFile.StorageUrl, 302);
  } catch {
    return NextResponse.json(
      { message: "Download mislukt. Probeer het opnieuw." },
      { status: 500 },
    );
  }
}
