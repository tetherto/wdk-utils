/**
 * Strips "lightning:" URI prefix (case-insensitive). Does not trim after slice.
 *
 * @param {string} input
 * @returns {string}
 */
export function stripLightningPrefix(input: string): string;
/**
 * Validates a Lightning Network invoice (lnbc, lntb, lnbcrt, lni; length >= 20).
 *
 * @param {string} address The invoice to validate.
 * @returns {LightningInvoiceValidationResult}
 */
export function validateLightningInvoice(address: string): LightningInvoiceValidationResult;
/**
 * Validates Lightning Address format (email: user@domain.tld).
 *
 * @param {string} address The address to validate.
 * @returns {LightningAddressValidationResult}
 */
export function validateLightningAddress(address: string): LightningAddressValidationResult;
export type LightningInvoiceValidationSuccess = {
    success: true;
    type: "invoice";
};
export type LightningInvoiceValidationFailure = {
    success: false;
    reason: string;
};
export type LightningInvoiceValidationResult = LightningInvoiceValidationSuccess | LightningInvoiceValidationFailure;
export type LightningAddressValidationSuccess = {
    success: true;
    type: "address";
};
export type LightningAddressValidationFailure = {
    success: false;
    reason: string;
};
export type LightningAddressValidationResult = LightningAddressValidationSuccess | LightningAddressValidationFailure;
