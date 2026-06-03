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
 * Payment descriptions are user-defined and can contain injection attacks.
 * Always sanitize descriptions before rendering in HTML or persisting in databases.
 *
 * @param {string} invoice - The BOLT11 invoice string to decode.
 * @returns {LightningInvoiceDecodingResult}
 */
export function decode(invoice: string): LightningInvoiceDecodingResult;
/**
 * Returns the SHA-256 hash that needs to be signed for an invoice.
 * @param {DecodedLightningInvoice} invoiceData
 * @returns {LightningInvoiceHashingResult}
 */
export function getHashToSign(invoiceData: DecodedLightningInvoice): LightningInvoiceHashingResult;
/**
 * Signs a BOLT11 invoice.
 * @param {DecodedLightningInvoice} invoiceData
 * @param {string | Uint8Array} privateKey - Hex-encoded string or Uint8Array
 * @returns {LightningInvoiceSigningResult} The signed invoice data
 */
export function sign(invoiceData: DecodedLightningInvoice, privateKey: string | Uint8Array): LightningInvoiceSigningResult;
/**
 * Encodes a BOLT11 invoice.
 * @param {DecodedLightningInvoice} invoiceData
 * @returns {LightningInvoiceEncodingResult}
 */
export function encode(invoiceData: DecodedLightningInvoice): LightningInvoiceEncodingResult;
export type TagData = string | number | Uint8Array;
export type Tag = {
    tagName: string;
    data: TagData;
};
export type DecodedLightningInvoice = {
    network: "bitcoin" | "regtest" | "testnet" | "signet";
    millisatoshis?: string | null;
    timestamp?: number;
    timeExpireDate?: number;
    payeeNodeKey?: string;
    signature?: string;
    recoveryFlag?: number;
    tags: Tag[];
    paymentRequest?: string;
};
export type LightningInvoiceValidationSuccess = {
    success: true;
    type: "invoice";
};
export type LightningInvoiceValidationFailure = {
    success: false;
    reason: string;
};
export type LightningInvoiceValidationResult = LightningInvoiceValidationSuccess | LightningInvoiceValidationFailure;
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
export type LightningInvoiceHashingSuccess = {
    success: true;
    type: "hash";
    data: Uint8Array;
};
export type LightningInvoiceHashingFailure = {
    success: false;
    reason: string;
};
export type LightningInvoiceHashingResult = LightningInvoiceHashingSuccess | LightningInvoiceHashingFailure;
export type LightningInvoiceSigningSuccess = {
    success: true;
    type: "invoice";
    data: DecodedLightningInvoice;
};
export type LightningInvoiceSigningFailure = {
    success: false;
    reason: string;
};
export type LightningInvoiceSigningResult = LightningInvoiceSigningSuccess | LightningInvoiceSigningFailure;
export type LightningInvoiceEncodingSuccess = {
    success: true;
    type: "invoice";
    data: string;
};
export type LightningInvoiceEncodingFailure = {
    success: false;
    reason: string;
};
export type LightningInvoiceEncodingResult = LightningInvoiceEncodingSuccess | LightningInvoiceEncodingFailure;
