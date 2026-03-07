/**
 * Validates a Spark address.
 * Accepts Bitcoin format or alphanumeric string (20-100 chars).
 *
 * @param {string} address The address to validate.
 * @returns {SparkAddressValidationResult}
 */
export function validateSparkAddress(address: string): SparkAddressValidationResult;
export type SparkAddressValidationSuccess = {
    success: true;
    type: "btc" | "alphanumeric";
};
export type SparkAddressValidationFailure = {
    success: false;
    reason: string;
};
export type SparkAddressValidationResult = SparkAddressValidationSuccess | SparkAddressValidationFailure;
