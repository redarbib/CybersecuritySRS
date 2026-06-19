import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const AUTH_SESSION_COOKIE = "srs_session";
export const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type AuthSession = {
  userId: number;
  email: string;
};

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.SECRET_CODE?.trim() ||
    "dev-session-secret"
  );
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function encodePayload(payload: AuthSession): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodePayload(encodedPayload: string): AuthSession | null {
  try {
    const parsedValue = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<AuthSession>;

    const userId = Number(parsedValue.userId);
    const email =
      typeof parsedValue.email === "string" ? parsedValue.email : "";

    if (!Number.isInteger(userId) || userId <= 0 || !email.trim()) {
      return null;
    }

    return {
      userId,
      email: email.trim(),
    };
  } catch {
    return null;
  }
}

function parseCookieHeader(
  cookieHeader: string | null,
): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((accumulator, currentValue) => {
      const separatorIndex = currentValue.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }
      const cookieName = currentValue.slice(0, separatorIndex).trim();
      const cookieValue = currentValue.slice(separatorIndex + 1).trim();
      if (!cookieName) {
        return accumulator;
      }
      accumulator[cookieName] = decodeURIComponent(cookieValue);
      return accumulator;
    }, {});
}

export function createSessionToken(session: AuthSession): string {
  const encodedPayload = encodePayload(session);
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function getSessionFromToken(
  token: string | null | undefined,
): AuthSession | null {
  if (!token) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".");
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const providedBuffer = Buffer.from(providedSignature, "utf8");
  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return null;
  }

  return decodePayload(encodedPayload);
}

export function getSessionFromCookieHeader(
  cookieHeader: string | null,
): AuthSession | null {
  const parsedCookies = parseCookieHeader(cookieHeader);
  return getSessionFromToken(parsedCookies[AUTH_SESSION_COOKIE]);
}

export async function getSessionFromServerCookies(): Promise<AuthSession | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  return getSessionFromToken(sessionToken);
}

// Sign out button
export async function deleteSessionFromServerCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_SESSION_COOKIE);
}