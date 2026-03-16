/**
 * Validates a Spark address.
 * A Spark address can be a native Bech32m encoded address or a standard
 * Bitcoin address for L1 deposits.
 *
 * @param {string} address The address to validate.
 * @returns {SparkAddressValidationResult}
 */
export function validateSparkAddress(address: string): SparkAddressValidationResult;
export type SparkAddressValidationSuccess = {
    success: true;
    type: "spark" | "btc";
};
export type SparkAddressValidationFailure = {
    success: false;
    reason: string;
};
export type SparkAddressValidationResult = SparkAddressValidationSuccess | SparkAddressValidationFailure;
