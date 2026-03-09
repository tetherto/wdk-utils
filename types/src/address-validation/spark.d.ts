/**
 * @typedef {{ success: true, type: 'spark' | 'alphanumeric' }} SparkAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} SparkAddressValidationFailure
 * @typedef {SparkAddressValidationSuccess | SparkAddressValidationFailure} SparkAddressValidationResult
 */
/**
 * Validates a Spark address.
 * Accepts Spark bech32 format (spark1...) or alphanumeric string (20-100 chars).
 *
 * @param {string} address The address to validate.
 * @returns {SparkAddressValidationResult}
 */
export function validateSparkAddress(address: string): SparkAddressValidationResult;
export type SparkAddressValidationSuccess = {
    success: true;
    type: "spark" | "alphanumeric";
};
export type SparkAddressValidationFailure = {
    success: false;
    reason: string;
};
export type SparkAddressValidationResult = SparkAddressValidationSuccess | SparkAddressValidationFailure;
