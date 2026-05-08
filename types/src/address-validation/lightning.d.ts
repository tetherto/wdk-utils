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
 * Decodes a BOLT11 Lightning Network invoice.
 *
 * @param {string} invoice The BOLT11 invoice string to decode.
 * @returns {LightningInvoiceDecodingResult}
 */
export function decodeLightningInvoice(invoice: string): LightningInvoiceDecodingResult;
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
export type LightningInvoiceValidationSuccess = {
    success: true;
    type: "invoice";
};
export type LightningInvoiceValidationFailure = {
    success: false;
    reason: string;
};
export type LightningInvoiceValidationResult = LightningInvoiceValidationSuccess | LightningInvoiceValidationFailure;
export type DecodedLightningInvoice = {
    paymentRequest?: string;
    complete?: boolean;
    prefix?: string;
    wordsTemp?: string;
    network?: object;
    satoshis?: number | null;
    millisatoshis?: string | null;
    timestamp?: number;
    timestampString?: string;
    timeExpireDate?: number;
    timeExpireDateString?: string;
    payeeNodeKey?: string;
    signature?: string;
    recoveryFlag?: number;
    tags: Array<{
        tagName: string;
        data: string | number | object;
    }>;
};
export type LightningInvoiceDecodingSuccess = {
    success: true;
    type: "invoice";
    data: DecodedLightningInvoice;
};
export type LightningInvoiceDecodingFailure = {
    success: false;
    reason: string;
};
export type LightningInvoiceDecodingResult = LightningInvoiceDecodingSuccess | LightningInvoiceDecodingFailure;
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
