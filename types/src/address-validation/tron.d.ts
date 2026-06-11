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
