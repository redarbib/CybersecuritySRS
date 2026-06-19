// This is used to download 1 specific file
import { NextResponse } from "next/server";
import { RowDataPacket } from "mysql2/promise";
import pool from "../../../../lib/db";
import { isValidSecretHash } from "../../../../lib/secretHash";
import { getSessionFromCookieHeader } from "../../../../lib/authSession";

type FileRow = RowDataPacket & {
  Id: number;
  UserId: number;
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
    const requestedSecretHash = requestUrl.searchParams.get("code");
    const hasValidSecretHash = requestedSecretHash
      ? await isValidSecretHash(requestedSecretHash)
      : false;
    const session = getSessionFromCookieHeader(request.headers.get("cookie"));
    const requestedUserId = parseUserId(requestUrl.searchParams.get("userId"));
    const targetUserId = requestedUserId ?? session?.userId ?? null;
    const hasSessionAccess = Boolean(
      session && targetUserId && session.userId === targetUserId,
    );
    const hasSecretAccess = Boolean(
      requestedSecretHash && hasValidSecretHash && targetUserId,
    );

    if (!targetUserId || (!hasSessionAccess && !hasSecretAccess)) {
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
      `SELECT f.Id, f.StorageUrl, t.UserId
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

    if (!isTrustedStorageUrl(targetFile.StorageUrl)) {
      return NextResponse.json(
        { message: "Ongeldige storage URL." },
        { status: 400 },
      );
    }

    return NextResponse.redirect(targetFile.StorageUrl, 302);
  } catch (error) {
    console.error("ERROR: API - download", (error as Error).message);
    return NextResponse.json(
      { message: "Download mislukt. Probeer het opnieuw." },
      { status: 500 },
    );
  }
}