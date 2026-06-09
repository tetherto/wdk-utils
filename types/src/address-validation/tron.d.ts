/**
 * @typedef {{ success: true, type: 'tron' }} TronAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} TronAddressValidationFailure
 * @typedef {TronAddressValidationSuccess | TronAddressValidationFailure} TronAddressValidationResult
 */
/**
 * Validates a Tron address.
 *
 * @param {string} address The address to validate.
 * @returns {TronAddressValidationResult}
 */
export function validateTronAddress(address: string): TronAddressValidationResult;
export type TronAddressValidationSuccess = {
    success: true;
    type: "tron";
};
export type TronAddressValidationFailure = {
    success: false;
    reason: string;
};
export type TronAddressValidationResult = TronAddressValidationSuccess | TronAddressValidationFailure;
