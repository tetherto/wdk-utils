/**
 * Strips "lightning:" URI prefix (case-insensitive). The input is trimmed first.
 *
 * @param {string} input
 * @returns {string} Returns a string. Returns an empty string if input is not a string.
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
 * Validates an LNURL address (lnurl1... bech32 encoded URL).
 *
 * @param {string} address The LNURL to validate.
 * @returns {LnurlValidationResult}
 */
export function validateLnurl(address: string): LnurlValidationResult;
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
export type LnurlValidationSuccess = {
    success: true;
    type: "lnurl";
};
export type LnurlValidationFailure = {
    success: false;
    reason: string;
};
export type LnurlValidationResult = LnurlValidationSuccess | LnurlValidationFailure;
export type LightningAddressValidationSuccess = {
    success: true;
    type: "address";
};
export type LightningAddressValidationFailure = {
    success: false;
    reason: string;
};
export type LightningAddressValidationResult = LightningAddressValidationSuccess | LightningAddressValidationFailure;
