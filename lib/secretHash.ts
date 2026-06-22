function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashSecretCode(secretCode: string): Promise<string> {
  // Encode an string using UTF-8 with the secretCode
  const encodedSecret = new TextEncoder().encode(secretCode);

  // digest the encodedSecret with SHA-256
  const digest = await crypto.subtle.digest("SHA-256", encodedSecret);

  // Use function written above to turn the digest from bytes to hex
  return bytesToHex(new Uint8Array(digest));
}

// Resolve expeccted hash using the secretCode and code from .env
export async function resolveExpectedSecretHash(): Promise<string | null> {
  // Fetch secret code from the .env file
  const secretCode = process.env.SECRET_CODE?.trim();

  // If there is no secret code return null
  if (!secretCode) {
    return null;
  }

  // Return secretCode
  return hashSecretCode(secretCode);
}

// Checks if the hash is valid
export async function isValidSecretHash(
  requestedSecretHash: string | null,
): Promise<boolean> {
  if (!requestedSecretHash) {
    return false;
  }

  const expectedSecretHash = await resolveExpectedSecretHash();
  // If there is no expectedSecretHash using the function here above return false
  if (!expectedSecretHash) {
    return false;
  }

  // Check whether the provided secret hash matches the expected hash
  return requestedSecretHash === expectedSecretHash;
}
