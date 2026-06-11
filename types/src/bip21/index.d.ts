/**
 * Returns true if the input looks like a BIP-21 Bitcoin payment URI.
 * This is a syntactic check only — it does not validate the address or parameters.
 *
 * @param {string} input
 * @returns {boolean}
 */
export function isBip21Request(input: string): boolean;
/**
 * Parses a BIP-21 Bitcoin payment URI.
 *
 * Supports:
 *   bitcoin:<address>[?amount=<btc>][&label=<label>][&message=<message>]
 *
 * @param {string} input
 * @returns {Bip21ParseResult}
 */
export function parseBip21Request(input: string): Bip21ParseResult;
/**
 * Encodes a BIP-21 Bitcoin payment URI from a request object.
 *
 * @param {Bip21Request} request
 * @returns {string}
 */
export function encodeBip21Request(request: Bip21Request): string;
export type Bip21Request = {
    /** Validated Bitcoin address */
    address: string;
    /** Decimal BTC amount, up to 8 decimal places (e.g. '0.001') */
    amount?: string;
    /** URL-decoded label */
    label?: string;
    /** URL-decoded message */
    message?: string;
};
export type Bip21ParseSuccess = {
    success: true;
    type: "bip21";
    value: Bip21Request;
};
export type Bip21ParseFailure = {
    success: false;
    reason: "INVALID_FORMAT" | "INVALID_ADDRESS" | "INVALID_AMOUNT" | "UNSUPPORTED_REQUIRED_PARAM";
};
export type Bip21ParseResult = Bip21ParseSuccess | Bip21ParseFailure;
