/**
 * Validates a Universal Money Address (format: $user@domain.tld).
 *
 * @param {string} address The address to validate.
 * @returns {UmaAddressValidationResult}
 */
export function validateUmaAddress(address: string): UmaAddressValidationResult;
/**
 * Resolves UMA username into address components and the underlying Lightning Address.
 * UMA is built on Lightning Addresses; this returns the user@domain form used for resolution.
 *
 * @param {string} uma - UMA string (e.g. $you@uma.money)
 * @returns {{ localPart: string; domain: string; lightningAddress: string } | null} Parsed parts and lightningAddress (user@domain), or null if invalid
 */
export function resolveUmaUsername(uma: string): {
    localPart: string;
    domain: string;
    lightningAddress: string;
} | null;
export type UmaAddressValidationSuccess = {
    success: true;
    type: "uma";
};
export type UmaAddressValidationFailure = {
    success: false;
    reason: string;
};
export type UmaAddressValidationResult = UmaAddressValidationSuccess | UmaAddressValidationFailure;
