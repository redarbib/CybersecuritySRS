function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashSecretCode(secretCode: string): Promise<string> {
  const encodedSecret = new TextEncoder().encode(secretCode);
  const digest = await crypto.subtle.digest("SHA-256", encodedSecret);
  return bytesToHex(new Uint8Array(digest));
}

export async function resolveExpectedSecretHash(): Promise<string | null> {

  // Fetch secret code from the env
  const secretCode = process.env.SECRET_CODE?.trim();

  // If there is no secret code return null
  if (!secretCode) {
    return null;
  }

  return hashSecretCode(secretCode);
}

export async function isValidSecretHash(
  requestedSecretHash: string | null,
): Promise<boolean> {
  if (!requestedSecretHash) {
    return false;
  }

  const expectedSecretHash = await resolveExpectedSecretHash();
  if (!expectedSecretHash) {
    return false;
  }

  return requestedSecretHash === expectedSecretHash;
}
