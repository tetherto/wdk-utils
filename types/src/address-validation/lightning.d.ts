/**
 * Strips "lightning:" URI prefix (case-insensitive). The input is trimmed first.
 *
 * @param {string} input
 * @returns {string} Returns a string. Returns an empty string if input is not a string.
 */
/**
 * Validates an LNURL address (lnurl1... bech32 encoded URL).
 *
 * @param {string} address The LNURL to validate.
 * @returns {LnurlValidationResult}
 */
export function validateLnurl(address: string): LnurlValidationResult;
/**
 * Decodes an LNURL address into its original URL.
 *
 * @param {string} address The LNURL to decode.
 * @returns {LnurlDecodingResult}
 */
export function decodeLnurl(address: string): LnurlDecodingResult;
/**
 * Validates Lightning Address format (email: user@domain.tld).
 *
 * @param {string} address The address to validate.
 * @returns {LightningAddressValidationResult}
 */
export function validateLightningAddress(address: string): LightningAddressValidationResult;
export type LnurlValidationSuccess = {
    success: true;
    type: "lnurl";
};
export type LnurlValidationFailure = {
    success: false;
    reason: string;
};
export type LnurlValidationResult = LnurlValidationSuccess | LnurlValidationFailure;
export type LnurlDecodingSuccess = {
    success: true;
    type: "lnurl";
    data: string;
};
export type LnurlDecodingFailure = {
    success: false;
    reason: string;
};
export type LnurlDecodingResult = LnurlDecodingSuccess | LnurlDecodingFailure;
export type LightningAddressValidationSuccess = {
    success: true;
    type: "address";
};
export type LightningAddressValidationFailure = {
    success: false;
    reason: string;
};
export type LightningAddressValidationResult = LightningAddressValidationSuccess | LightningAddressValidationFailure;
