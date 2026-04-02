/**
 * @typedef {{
 *   recipient: string
 *   tokenAddress: string
 *   chainId: number
 *   amountSmallest: string
 * }} Eip681TransferRequest
 */
/**
 * @typedef {{
 *   success: true
 *   type: 'eip681-transfer'
 *   value: Eip681TransferRequest
 * }} Eip681ParseSuccess
 */
/**
 * @typedef {{
 *   success: false
 *   reason:
 *     | 'INVALID_FORMAT'
 *     | 'UNSUPPORTED_METHOD'
 *     | 'MISSING_REQUIRED_PARAM'
 *     | 'INVALID_RECIPIENT'
 *     | 'INVALID_AMOUNT'
 * }} Eip681ParseFailure
 */
/**
 * @typedef {Eip681ParseSuccess | Eip681ParseFailure} Eip681ParseResult
 */
/**
 * Returns true if the input looks like an EIP-681 style request.
 * This is syntactic detection only (not a full validity check).
 *
 * @param {string} input
 * @returns {boolean}
 */
export function isEip681Request(input: string): boolean;
/**
 * Parses an EIP-681 transfer request.
 * Supports:
 *   <scheme>:<tokenAddress>@<chainId>/transfer?address=<recipient>&uint256=<amount>
 * and `value` as an alias for `uint256`.
 *
 * @param {string} input
 * @returns {Eip681ParseResult}
 */
export function parseEip681Request(input: string): Eip681ParseResult;
export type Eip681TransferRequest = {
    recipient: string;
    tokenAddress: string;
    chainId: number;
    amountSmallest: string;
};
export type Eip681ParseSuccess = {
    success: true;
    type: "eip681-transfer";
    value: Eip681TransferRequest;
};
export type Eip681ParseFailure = {
    success: false;
    reason: "INVALID_FORMAT" | "UNSUPPORTED_METHOD" | "MISSING_REQUIRED_PARAM" | "INVALID_RECIPIENT" | "INVALID_AMOUNT";
};
export type Eip681ParseResult = Eip681ParseSuccess | Eip681ParseFailure;
