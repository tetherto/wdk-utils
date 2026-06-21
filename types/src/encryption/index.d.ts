/**
 * Derives a 32-byte encryption key from a password and salt using scrypt.
 *
 * @param {string} password - The passphrase.
 * @param {Uint8Array} salt - The salt bytes.
 * @param {ScryptParams} [scryptParams] - Optional scrypt cost parameters.
 * @returns {Uint8Array} The derived key bytes.
 */
export function deriveKey(password: string, salt: Uint8Array, scryptParams?: ScryptParams): Uint8Array;
/**
 * Encrypts a plaintext string with AES-256-GCM using a password-derived key.
 *
 * @param {string} plaintext - The string to encrypt.
 * @param {string} password - The passphrase used to derive the key.
 * @param {ScryptParams} [scryptParams] - Optional scrypt cost parameters.
 * @returns {EncryptedPayload} The encrypted payload including salt, IV, tag, and ciphertext.
 */
export function encrypt(plaintext: string, password: string, scryptParams?: ScryptParams): EncryptedPayload;
/**
 * Decrypts an encrypted payload using a pre-derived key.
 *
 * @param {EncryptedPayload} payload - The encrypted payload.
 * @param {Uint8Array} key - The 32-byte AES key.
 * @returns {string} The decrypted plaintext.
 */
export function decryptWithKey(payload: EncryptedPayload, key: Uint8Array): string;
/**
 * Decrypts an encrypted payload using a password.
 *
 * @param {EncryptedPayload} payload - The encrypted payload.
 * @param {string} password - The passphrase used to derive the key.
 * @returns {string} The decrypted plaintext.
 */
export function decrypt(payload: EncryptedPayload, password: string): string;
/** @type {Required<ScryptParams>} */
export const DEFAULT_SCRYPT_PARAMS: Required<ScryptParams>;
export type ScryptParams = {
    /**
     * - scrypt CPU/memory cost parameter (power of 2).
     */
    N?: number;
    /**
     * - scrypt block size parameter.
     */
    r?: number;
    /**
     * - scrypt parallelization parameter.
     */
    p?: number;
};
export type EncryptedPayload = {
    /**
     * - The payload format version.
     */
    version: 1;
    /**
     * - The scrypt salt (hex).
     */
    salt: string;
    /**
     * - The AES-GCM initialization vector (hex).
     */
    iv: string;
    /**
     * - The AES-GCM authentication tag (hex).
     */
    tag: string;
    /**
     * - The encrypted payload (hex).
     */
    ciphertext: string;
    /**
     * - scrypt N used for key derivation.
     */
    scryptN?: number;
    /**
     * - scrypt r used for key derivation.
     */
    scryptR?: number;
    /**
     * - scrypt p used for key derivation.
     */
    scryptP?: number;
};
