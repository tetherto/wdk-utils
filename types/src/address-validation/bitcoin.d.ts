export function validateBase58(address: any): BtcAddressValidationSuccess | {
    decoded: Uint8Array;
} | {
    success: boolean;
    reason: string;
};
/**
 * Validates a Bech32 address for any supported network.
 * @param {string} address - The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateBech32(address: string): BtcAddressValidationResult;
/**
 * Validates a Bech32m address for any supported network.
 * @param {string} address - The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateBech32m(address: string): BtcAddressValidationResult;
/**
 * Validates a Bitcoin address for mainnet or testnet.
 *
 * @param {string} address The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateBitcoinAddress(address: string): BtcAddressValidationResult;
export type BtcAddressValidationSuccess = {
    success: true;
    type: "p2pkh" | "p2sh" | "bech32" | "bech32m";
    network: "mainnet" | "testnet" | "regtest";
};
export type BtcAddressValidationFailure = {
    success: false;
    reason: string;
};
export type BtcAddressValidationResult = BtcAddressValidationSuccess | BtcAddressValidationFailure;
