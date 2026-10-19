/**
 * @typedef {{ success: true, type: 'lnurl' }} LnurlValidationSuccess
 * @typedef {{ success: false, reason: string }} LnurlValidationFailure
 * @typedef {LnurlValidationSuccess | LnurlValidationFailure} LnurlValidationResult
 */
/**
 * Validates an LNURL address (lnurl1... bech32 encoded URL).
 *
 * @param {string} address The LNURL to validate.
 * @returns {LnurlValidationResult}
 */
export function validateLnurl(address: string): LnurlValidationResult;
/**
 * @typedef {{ success: true, type: 'lnurl', data: string }} LnurlDecodingSuccess
 * @typedef {{ success: false, reason: 'INVALID_FORMAT' | 'EMPTY_ADDRESS' | 'INVALID_PREFIX' | 'MIXED_CASE' | 'INVALID_BECH32_FORMAT' | 'UNSUPPORTED_URL' }} LnurlDecodingFailure
 * @typedef {LnurlDecodingSuccess | LnurlDecodingFailure} LnurlDecodingResult
 */
/**
 * Decodes an LNURL address into its original URL.
 *
 * Only `https:` URLs are accepted, plus `http:` URLs of `.onion` hosts, as required by LUD-01.
 *
 * @param {string} address The LNURL to decode.
 * @returns {LnurlDecodingResult} The decoded URL, or `UNSUPPORTED_URL` when the target is not an allowed URL.
 */
export function decodeLnurl(address: string): LnurlDecodingResult;
/**
 * @typedef {{ success: true, type: 'address' }} LightningAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} LightningAddressValidationFailure
 * @typedef {LightningAddressValidationSuccess | LightningAddressValidationFailure} LightningAddressValidationResult
 */
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
    reason: "INVALID_FORMAT" | "EMPTY_ADDRESS" | "INVALID_PREFIX" | "MIXED_CASE" | "INVALID_BECH32_FORMAT" | "UNSUPPORTED_URL";
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
