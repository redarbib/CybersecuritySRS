import path from "node:path";
import { ResultSetHeader } from "mysql2/promise";
import { z } from "zod";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import pool from "../../../../lib/db";
import { createFileAccessToken } from "../../../../lib/fileAccessToken";
import { getSessionFromCookieHeader } from "../../../../lib/authSession";

// Define MAX variables
const MAX_FILE_SIZE = "2GB";
const MAX_TOTAL_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_FILE_COUNT = 200;

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

// Initialize UploadThing
const f = createUploadthing();

// Trim optional strings and convert empty values to null
function normalizeOptionalString(value: string | undefined): string | null {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : null;
}

export const ourFileRouter = {
  secureFileUploader: f({
    // Configure upload route for blob files
    blob: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileCount: MAX_FILE_COUNT,
      minFileCount: 1,
      contentDisposition: "attachment",
    },
  })
    .input(
      // Validate incoming form data
      z.object({
        title: z.string().max(255).optional(),
        message: z.string().max(2000).optional(),
        link: z.string().url().optional(),
        expiryDate: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/) // Accept only YYYY-MM-DD format
          .optional(),
        folderName: z.string().max(255).optional(),
      }),
    )
    .middleware(async ({ files, input, req }) => {
      // Get user session from cookies
      const session = getSessionFromCookieHeader(req.headers.get("cookie"));

      // Reject unauthenticated uploads
      if (!session) {
        throw new UploadThingError("Je moet ingelogd zijn om te uploaden.");
      }

      // Calculate total upload size
      const totalUploadBytes = files.reduce(
        (accumulator, currentFile) => accumulator + currentFile.size,
        0,
      );

      // Reject oversized uploads
      if (totalUploadBytes > MAX_TOTAL_UPLOAD_BYTES) {
        throw new UploadThingError(
          "Totale upload is te groot. Maximum is 2GB per upload.",
        );
      }

      // Validate each file extension
      for (const currentFile of files) {
        const fileExtension = path
          .extname(currentFile.name)
          .slice(1)
          .toLowerCase();

        // Reject disallowed file types
        if (!fileExtension || !ALLOWED_FILE_TYPES.has(fileExtension)) {
          throw new UploadThingError(
            "Bestandstype niet toegestaan. Toegestaan: png, mp3, mp4, rar, zip, csv, txt, docx, pdf.",
          );
        }
      }

      // Normalize optional form fields
      const normalizedTitle = normalizeOptionalString(input.title);
      const normalizedMessage = normalizeOptionalString(input.message);
      const normalizedLink = normalizeOptionalString(input.link);
      const normalizedExpiryDate = normalizeOptionalString(input.expiryDate);
      const normalizedFolderName = normalizeOptionalString(input.folderName);

      // Create a new transfer record in database
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

      // Extract transfer ID
      const createdTransferId = Number(transferInsertResult.insertId);

      // Ensure transfer creation succeeded
      if (!Number.isInteger(createdTransferId) || createdTransferId <= 0) {
        throw new UploadThingError(
          "Upload mislukt: transfer kon niet worden aangemaakt.",
        );
      }

      // Pass metadata to upload completion step
      return {
        userId: session.userId,
        transferId: createdTransferId,
        folderName: normalizedFolderName,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        // Determine stored file URL
        const storageUrl = file.ufsUrl ?? file.url ?? null;

        // Ensure storage URL exists
        if (!storageUrl) {
          throw new UploadThingError("Upload mislukt: storage URL ontbreekt.");
        }

        // Extract file extension
        const fileType = path.extname(file.name).slice(1).toLowerCase();

        // Insert uploaded file metadata into database
        const [fileInsertResult] = await pool.execute<ResultSetHeader>(
          `INSERT INTO files (TransferId, FileSize, FileName, FileType, StorageUrl)
           VALUES (?, ?, ?, ?, ?)`,
          [metadata.transferId, file.size, file.name, fileType, storageUrl],
        );

        // Extract file ID
        const createdFileId = Number(fileInsertResult.insertId);

        // Ensure file creation succeeded
        if (!Number.isInteger(createdFileId) || createdFileId <= 0) {
          throw new UploadThingError(
            "Upload mislukt: kon geen file-id aanmaken.",
          );
        }

        // Build transfer page URL with a unique file token
        const transferPageToken = createFileAccessToken(
          createdFileId,
          metadata.userId,
        );
        const downloadPageUrl = transferPageToken
          ? `/transfer?file=${encodeURIComponent(transferPageToken)}`
          : null;

        // Build direct file download URL with a unique file token
        const fileDownloadToken = createFileAccessToken(
          createdFileId,
          metadata.userId,
        );
        const fileDownloadUrl = fileDownloadToken
          ? `/api/download?file=${encodeURIComponent(fileDownloadToken)}`
          : null;

        // Return upload result to client
        return {
          message: `Bestand "${file.name}" is succesvol geüpload.`,
          fileId: createdFileId,
          transferId: metadata.transferId,
          folderName: metadata.folderName,
          storageUrl,
          downloadPageUrl,
          fileDownloadUrl,
        };
      } catch {
        // Handle post-upload database failures
        throw new UploadThingError(
          "Upload voltooid, maar metadata opslaan is mislukt. Probeer het opnieuw.",
        );
      }
    }),
} satisfies FileRouter;

// Export router type for frontend usage
export type OurFileRouter = typeof ourFileRouter;
