import path from "node:path";
import { ResultSetHeader } from "mysql2/promise";
import { z } from "zod";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import pool from "../../../../lib/db";
import { resolveExpectedSecretHash } from "../../../../lib/secretHash";
import { getSessionFromCookieHeader } from "../../../../lib/authSession";
const MAX_FILE_SIZE = "2GB";
const MAX_TOTAL_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_FILE_COUNT = 200;

// Allowed file types
const ALLOWED_FILE_TYPES = new Set([
  "png",
  "mp3",
  "mp4",
  "rar",
  "zip",
  "csv",
  "docx",
  "pdf",
]);

const f = createUploadthing();

function normalizeOptionalString(value: string | undefined): string | null {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

export const ourFileRouter = {
  secureFileUploader: f({
    blob: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: MAX_FILE_COUNT,
      minFileCount: 1,
      contentDisposition: "attachment",
    },
  })
    .input(
      z.object({
        title: z.string().max(255).optional(),
        message: z.string().max(2000).optional(),
        link: z.string().url().optional(),
        expiryDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/)
          .optional(),
        folderName: z.string().max(255).optional(),
      }),
    )
    .middleware(async ({ files, input, req }) => {
      const session = getSessionFromCookieHeader(req.headers.get("cookie"));
      if (!session) {
        throw new UploadThingError("Je moet ingelogd zijn om te uploaden.");
      }
      const totalUploadBytes = files.reduce(
        (accumulator, currentFile) => accumulator + currentFile.size,
        0,
      );

      if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
        throw new UploadThingError(
          "Totale upload is te groot. Maximum is 2GB per upload.",
        );
      }
      for (const currentFile of files) {
        const fileExtension = path.extname(currentFile.name).slice(1).toLowerCase();
        if (!fileExtension || !ALLOWED_FILE_TYPES.has(fileExtension)) {
          throw new UploadThingError(
            "Bestandstype niet toegestaan. Toegestaan: png, mp3, mp4, rar, zip, csv, txt, docx, pdf.",
          );
        }
      }
      const normalizedTitle = normalizeOptionalString(input.title);
      const normalizedMessage = normalizeOptionalString(input.message);
      const normalizedLink = normalizeOptionalString(input.link);
      const normalizedExpiryDate = normalizeOptionalString(input.expiryDate);
      const normalizedFolderName = normalizeOptionalString(input.folderName);

      const [transferInsertResult] = await pool.execute<ResultSetHeader>(
        `INSERT INTO transfers (UserId, Title, Message, Link, ExpiryDate)
         VALUES (?, ?, ?, ?, ?)`,
        [
          session.userId,
          normalizedTitle,
          normalizedMessage,
          normalizedLink,
          normalizedExpiryDate,
        ],
      );

      const createdTransferId = Number(transferInsertResult.insertId);
      if (!Number.isInteger(createdTransferId) || createdTransferId <= 0) {
        throw new UploadThingError(
          "Upload mislukt: transfer kon niet worden aangemaakt.",
        );
      }

      return {
        userId: session.userId,
        transferId: createdTransferId,
        folderName: normalizedFolderName,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {

        const storageUrl = file.ufsUrl ?? file.url ?? null;
        if (!storageUrl) {
          throw new UploadThingError("Upload mislukt: storage URL ontbreekt.");
        }

        const fileType = path.extname(file.name).slice(1).toLowerCase();

        const [fileInsertResult] = await pool.execute<ResultSetHeader>(
          `INSERT INTO files (TransferId, FileSize, FileName, FileType, StorageUrl)
           VALUES (?, ?, ?, ?, ?)`,
          [metadata.transferId, file.size, file.name, fileType, storageUrl],
        );

        const createdFileId = Number(fileInsertResult.insertId);
        if (!Number.isInteger(createdFileId) || createdFileId <= 0) {
          throw new UploadThingError("Upload mislukt: kon geen file-id aanmaken.");
        }

        const secretHash = await resolveExpectedSecretHash();
        const downloadPageUrl = secretHash
          ? `/transfer?userId=${metadata.userId}&code=${encodeURIComponent(secretHash)}`
          : null;
        const fileDownloadUrl = secretHash
          ? `/api/download?fileId=${createdFileId}&userId=${metadata.userId}&code=${encodeURIComponent(secretHash)}`
          : null;

        return {
          message: `Bestand "${file.name}" is succesvol geüpload.`,
          fileId: createdFileId,
          transferId: metadata.transferId,
          folderName: metadata.folderName,
          storageUrl,
          downloadPageUrl,
          fileDownloadUrl,
        };
      } catch (error) {
        console.error(
          "ERROR: UploadThing - onUploadComplete",
          error instanceof Error ? error.message : "Unknown error",
        );
        throw new UploadThingError(
          "Upload voltooid, maar metadata opslaan is mislukt. Probeer het opnieuw.",
        );
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
