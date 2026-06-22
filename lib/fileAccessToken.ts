import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

type FileAccessPayload = {
  fileId: number;
  userId: number;
  nonce: string;
};

type FileAccessScope = {
  fileId: number;
  userId: number;
};

 // Resolve secret from environment variables with fallback for dev
function getFileAccessSecret(): string {
  return (
    process.env.FILE_ACCESS_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    process.env.SECRET_CODE?.trim() ||
    "dev-file-access-secret"
  );
}

// Create HMAC SHA-256 signature for payload integrity
function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getFileAccessSecret())
    .update(encodedPayload)
    .digest("base64url");
}

// Encode payload as base64url JSON string
function encodePayload(payload: FileAccessPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encodedPayload: string): FileAccessPayload | null {
  try {
    // Decode base64url payload and parse JSON safely
    const parsedValue = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<FileAccessPayload>;

    // Normalize and validate fileId
    const fileId = Number(parsedValue.fileId);
    // Normalize and validate userId
    const userId = Number(parsedValue.userId);
    // Ensure nonce is a non-empty string
    const nonce =
      typeof parsedValue.nonce === "string" ? parsedValue.nonce : "";

    // Validate payload structure and constraints
    if (
      !Number.isInteger(fileId) ||
      fileId <= 0 ||
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !nonce.trim()
    ) {
      return null;
    }

    // Return sanitized payload
    return {
      fileId,
      userId,
      nonce,
    };
  } catch {
    // Return null on malformed or invalid JSON
    return null;
  }
}

export function createFileAccessToken(
  fileId: number,
  userId: number,
): string | null {
  // Validate fileId input
  if (!Number.isInteger(fileId) || fileId <= 0) {
    return null;
  }

  // Validate userId input
  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  // Build payload with random nonce for uniqueness
  const payload: FileAccessPayload = {
    fileId,
    userId,
    nonce: randomBytes(16).toString("base64url"),
  };

  // Encode payload into transport-safe format
  const encodedPayload = encodePayload(payload);
  // Generate signature for tamper protection
  const signature = signPayload(encodedPayload);

  // Return token in "payload.signature" format
  return `${encodedPayload}.${signature}`;
}

export function getFileAccessFromToken(
  token: string | null | undefined,
): FileAccessScope | null {
  // Reject missing token
  if (!token) {
    return null;
  }

  // Split token into payload and signature
  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  // Recompute expected signature
  const expectedSignature = signPayload(encodedPayload);

  // Convert signatures to buffers for constant-time comparison
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  // Verify signature securely using timing-safe comparison
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  // Decode payload after signature validation
  const payload = decodePayload(encodedPayload);
  if (!payload) {
    return null;
  }

  // Return scoped access data
  return {
    fileId: payload.fileId,
    userId: payload.userId,
  };
}
