import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Name of the cookie used to store the session token
export const AUTH_SESSION_COOKIE = "srs_session";

// Session lifetime: 1 week in seconds
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

// Shape of the session data stored in the token
export type AuthSession = {
  userId: number;
  email: string;
};

// Uses environment variables if available, otherwise falls back to a dev secret
function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.SECRET_CODE?.trim() ||
    "dev-session-secret"
  );
}

// Create an HMAC SHA-256 signature for the payload
function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

// Convert session object into JSON → UTF-8 → base64url
function encodePayload(payload: AuthSession): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

// Decode token payload back into an AuthSession object
function decodePayload(encodedPayload: string): AuthSession | null {
  try {
    const parsedValue = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<AuthSession>;

    // Ensure userId is a positive integer
    const userId = Number(parsedValue.userId);

    // Ensure email is a string
    const email =
      typeof parsedValue.email === "string" ? parsedValue.email : "";

    // Reject invalid payloads
    if (!Number.isInteger(userId) || userId <= 0 || !email.trim()) {
      return null;
    }

    // Return cleaned session object
    return {
      userId,
      email: email.trim(),
    };
  } catch {
    // Return null if decoding/parsing fails
    return null;
  }
}

// Parse raw Cookie header into an object:
function parseCookieHeader(
  cookieHeader: string | null,
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";") // Split multiple cookies
    .map((entry) => entry.trim()) // Remove spaces
    .filter(Boolean) // Remove empty entries
    .reduce<Record<string, string>>((accumulator, currentValue) => {
      const separatorIndex = currentValue.indexOf("=");

      // Skip invalid cookie entries
      if (separatorIndex === -1) {
        return accumulator;
      }

      const cookieName = currentValue.slice(0, separatorIndex).trim();
      const cookieValue = currentValue.slice(separatorIndex + 1).trim();

      // Skip if cookie name is empty
      if (!cookieName) {
        return accumulator;
      }

      // Store decoded cookie value
      accumulator[cookieName] = decodeURIComponent(cookieValue);
      return accumulator;
    }, {});
}

// Create a signed session token:
export function createSessionToken(session: AuthSession): string {
  const encodedPayload = encodePayload(session);
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

// Validate and decode a session token
export function getSessionFromToken(
  token: string | null | undefined,
): AuthSession | null {
  if (!token) {
    return null;
  }

  // Split token into payload + signature
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  // Recompute expected signature
  const expectedSignature = signPayload(encodedPayload);

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");

  // Compare signatures using timing-safe comparison
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  // Signature is valid → decode payload
  return decodePayload(encodedPayload);
}

// Extract session from raw Cookie header string
export function getSessionFromCookieHeader(
  cookieHeader: string | null,
): AuthSession | null {
  const parsedCookies = parseCookieHeader(cookieHeader);

  return getSessionFromToken(parsedCookies[AUTH_SESSION_COOKIE]);
}

// Read session from Next.js server-side cookies API
export async function getSessionFromServerCookies(): Promise<AuthSession | null> {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  return getSessionFromToken(sessionToken);
}

// Delete the session cookie (used for logout/sign out)
export async function deleteSessionFromServerCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_SESSION_COOKIE);
}
