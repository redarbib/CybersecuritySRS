import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import pool from "../../../../lib/db";
import { resolveExpectedSecretHash } from "../../../../lib/secretHash";

const UPLOAD_DIRECTORY = path.join(process.cwd(), "uploads");
const CURRENT_USER_ID = 1;
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB Max size

// Define allowed file types
const ALLOWED_FILE_TYPES = new Set([
  "png",
  "mp3",
  "mp4",
  "rar",
  "zip",
  "csv",
  "txt",
  "docx",
  "pdf",
]);

function isSecureRequest(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  const requestUrl = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  return requestUrl.protocol === "https:" || forwardedProto === "https";
}

function sanitizeFileName(fileName: string): string {
  return path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
}
function parseTransferId(rawValue: FormDataEntryValue | null): number | null {
  if (typeof rawValue !== "string") {
    return null;
  }

  const parsedValue = Number(rawValue);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

async function resolveTransferId(
  client: PoolConnection,
  formData: FormData,
): Promise<number | null> {
  const providedTransferId = parseTransferId(formData.get("transferId"));
  if (providedTransferId) {
    return providedTransferId;
  }
  const titleEntry = formData.get("title");
  const messageEntry = formData.get("message");
  const linkEntry = formData.get("link");
  const expiryDateEntry = formData.get("expiryDate");

  const title =
    typeof titleEntry === "string" && titleEntry.trim()
      ? titleEntry.trim()
      : null;
  const message =
    typeof messageEntry === "string" && messageEntry.trim()
      ? messageEntry.trim()
      : null;
  const link =
    typeof linkEntry === "string" && linkEntry.trim() ? linkEntry.trim() : null;
  const expiryDate =
    typeof expiryDateEntry === "string" && expiryDateEntry.trim()
      ? expiryDateEntry.trim()
      : null;

  try {
    const [insertResult] = await client.execute<ResultSetHeader>(
      `INSERT INTO transfers (UserId, Title, Message, Link, ExpiryDate)
       VALUES (?, ?, ?, ?, ?)`,
      [CURRENT_USER_ID, title, message, link, expiryDate],
    );

    const createdTransferId = Number(insertResult.insertId);
    if (!Number.isInteger(createdTransferId) || createdTransferId <= 0) {
      return null;
    }

    return createdTransferId;
  } catch {
    return null;
  }
}

export const runtime = "nodejs";

export async function POST(request: Request) {
  let savedFilePath: string | null = null;
  let dbClient: PoolConnection | null = null;
  try {
    if (!isSecureRequest(request)) {
      return NextResponse.json(
        { message: "Beveiligde verbinding vereist (HTTPS)." },
        { status: 403 },
      );
    }
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "Geen bestand ontvangen." },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { message: "Het gekozen bestand is leeg." },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          message:
            "Bestand is te groot. Maximale toegestane grootte is 100 GB.",
        },
        { status: 400 },
      );
    }

    await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true });

    const safeOriginalName = sanitizeFileName(file.name);
    const extension = path.extname(safeOriginalName);
    const normalizedExtension = extension
      ? extension.slice(1).toLowerCase()
      : "";
    if (!normalizedExtension || !ALLOWED_FILE_TYPES.has(normalizedExtension)) {
      return NextResponse.json(
        {
          message:
            "Bestandstype niet toegestaan. Toegestaan: png, mp3, mp4, rar, zip, csv, txt, docx, pdf.",
        },
        { status: 400 },
      );
    }
    const baseName = path.basename(safeOriginalName, extension);
    const storedFileName = `${baseName}-${Date.now()}${extension}`;
    const targetPath = path.join(UPLOAD_DIRECTORY, storedFileName);
    savedFilePath = targetPath;

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    dbClient = await pool.getConnection();
    const transferId = await resolveTransferId(dbClient, formData);
    if (!transferId) {
      await fs.unlink(targetPath).catch(() => undefined);
      savedFilePath = null;
      return NextResponse.json(
        {
          message: "Upload mislukt: transfer kon niet worden aangemaakt.",
        },
        { status: 400 },
      );
    }

    const storageUrl = `/uploads/${storedFileName}`;
    const fileType = normalizedExtension;

    // Prepare SQL query
    const [fileInsertResult] = await dbClient.execute<ResultSetHeader>(
      `INSERT INTO files (TransferId, FileSize, FileName, FileType, StorageUrl)
       VALUES (?, ?, ?, ?, ?)`,
      [transferId, file.size, file.name, fileType, storageUrl],
    );
    const createdFileId = Number(fileInsertResult.insertId);
    if (!Number.isInteger(createdFileId) || createdFileId <= 0) {
      throw new Error("Kon geen geldig file-id aanmaken.");
    }
    const secretHash = await resolveExpectedSecretHash();
    const downloadPageUrl = secretHash
      ? `/download?userId=${CURRENT_USER_ID}&code=${encodeURIComponent(secretHash)}`
      : null;
    const fileDownloadUrl = secretHash
      ? `/api/download?fileId=${createdFileId}&userId=${CURRENT_USER_ID}&code=${encodeURIComponent(secretHash)}`
      : null;

    return NextResponse.json(
      {
        message: `Bestand "${file.name}" is succesvol geüpload.`,
        fileName: storedFileName,
        storageUrl,
        fileId: createdFileId,
        downloadPageUrl,
        fileDownloadUrl,
      },
      { status: 200 },
    );
  } catch (error) {
    if (savedFilePath) {
      await fs.unlink(savedFilePath).catch(() => undefined);
    }
    console.error("ERROR: API - upload", (error as Error).message);
    return NextResponse.json(
      { message: "Upload mislukt. Probeer het opnieuw." },
      { status: 500 },
    );
  } finally {
    dbClient?.release();
  }
}
