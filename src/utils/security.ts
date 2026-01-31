/**
 * Security utilities for the application.
 */

/**
 * Generates a SHA-256 hash of the input string.
 * @param message The string to hash
 * @returns The hex string representation of the hash
 */
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verifies if the input password matches the stored password.
 * Supports both plaintext and SHA-256 hashed stored passwords.
 *
 * @param input The password entered by the user
 * @param stored The password stored in environment variables (plaintext or hash)
 * @returns true if passwords match
 */
export async function verifyPassword(input: string, stored: string): Promise<boolean> {
  // Check if stored is a SHA-256 hash (64 hex chars)
  // We use a regex to check for exactly 64 hexadecimal characters
  const isHash = /^[a-f0-9]{64}$/i.test(stored);

  if (isHash) {
    const inputHash = await sha256(input);
    return inputHash.toLowerCase() === stored.toLowerCase();
  }

  // Fallback to plaintext comparison
  if (input === stored) {
    console.warn(
      'SECURITY WARNING: Admin password is stored in plain text. ' +
      'Please update your VITE_ADMIN_PASSWORD to use a SHA-256 hash.'
    );
    return true;
  }

  return false;
}
