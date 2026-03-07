/**
 * Validates a P2PKH address.
 * Assumes the address starts with '1'.
 * @param {string} address The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateP2PKH(address: string): BtcAddressValidationResult;
/**
 * Validates a P2SH address.
 * Assumes the address starts with '3'.
 * @param {string} address The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateP2SH(address: string): BtcAddressValidationResult;
/**
 * Validates a Bech32 or Bech32m address.
 * Assumes the address starts with 'bc1' (case-insensitive).
 * @param {string} address The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateBech32(address: string): BtcAddressValidationResult;
/**
 * Validates a Bitcoin address and returns a detailed result.
 * Supports: P2PKH (1...), P2SH (3...), Bech32 (bc1...).
 *
 * @param {string} address
 * @returns {BtcAddressValidationResult}
 */
export function validateBitcoinAddress(address: string): BtcAddressValidationResult;
export type BtcAddressValidationSuccess = {
    success: true;
    type: "p2pkh" | "p2sh" | "bech32";
};
export type BtcAddressValidationFailure = {
    success: false;
    reason: string;
};
export type BtcAddressValidationResult = BtcAddressValidationSuccess | BtcAddressValidationFailure;
