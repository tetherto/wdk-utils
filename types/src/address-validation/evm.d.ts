/**
 * @typedef {{ success: true, type: 'evm' }} EvmAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} EvmAddressValidationFailure
 * @typedef {EvmAddressValidationSuccess | EvmAddressValidationFailure} EvmAddressValidationResult
 */
/**
 * Validates an EVM address (format + optional EIP-55 checksum).
 * If mixed case, checksum must match; all lowercase or all uppercase is valid.
 *
 * @param {string} address The address to validate.
 * @returns {EvmAddressValidationResult}
 */
export function validateEVMAddress(address: string): EvmAddressValidationResult;
export type EvmAddressValidationSuccess = {
    success: true;
    type: "evm";
};
export type EvmAddressValidationFailure = {
    success: false;
    reason: string;
};
export type EvmAddressValidationResult = EvmAddressValidationSuccess | EvmAddressValidationFailure;
