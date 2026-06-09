/**
 * Returns true if the input looks like a BIP-21 Bitcoin payment URI.
 * This is syntactic detection only (not a full validity check).
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
export type Bip21Request = {
    address: string;
    amount?: string;
    label?: string;
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
