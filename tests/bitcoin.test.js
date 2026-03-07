import {
  validateBitcoinAddress,
  validateP2PKH,
  validateP2SH,
  validateBech32,
} from '../src/address-validation/bitcoin.js';

describe('bitcoin', () => {
  const validP2PKH = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
  const validP2SH = '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC';
  const validBech32 = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  const validTaproot = 'bc1pqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqsyjer9e';

  describe('validateBitcoinAddress', () => {
    it('returns success with type p2pkh for P2PKH address', () => {
      expect(validateBitcoinAddress(validP2PKH)).toEqual({ success: true, type: 'p2pkh' });
    });
    it('returns success with type p2sh for P2SH address', () => {
      expect(validateBitcoinAddress(validP2SH)).toEqual({ success: true, type: 'p2sh' });
    });
    it('returns success with type bech32 for Bech32 (bc1q...)', () => {
      expect(validateBitcoinAddress(validBech32)).toEqual({ success: true, type: 'bech32' });
    });
    it('returns success with type bech32 for Taproot (bc1p...)', () => {
      expect(validateBitcoinAddress(validTaproot)).toEqual({ success: true, type: 'bech32' });
    });
    it('returns INVALID_LENGTH for too short P2PKH', () => {
      expect(validateBitcoinAddress('1' + 'a'.repeat(24))).toEqual({ success: false, reason: 'INVALID_LENGTH' });
    });
    it('returns INVALID_CHECKSUM for invalid base58 char in P2PKH', () => {
      expect(validateBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN' + '0')).toEqual({ success: false, reason: 'INVALID_CHECKSUM' });
    });
    it('returns UNKNOWN_PREFIX for EVM address', () => {
      expect(validateBitcoinAddress('0x742d35cc6634c0532925a3b844bc454e4438f44e')).toEqual({ success: false, reason: 'UNKNOWN_PREFIX' });
    });
    it('returns UNKNOWN_PREFIX for lightning invoice', () => {
      expect(validateBitcoinAddress('lnbc1xxx')).toEqual({ success: false, reason: 'UNKNOWN_PREFIX' });
    });
    it('returns INVALID_FORMAT for empty string', () => {
      expect(validateBitcoinAddress('')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for null', () => {
      expect(validateBitcoinAddress(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
  });

  describe('validateP2PKH', () => {
    it('returns success with type p2pkh for valid P2PKH', () => {
      expect(validateP2PKH(validP2PKH)).toEqual({ success: true, type: 'p2pkh' });
    });
    it('returns INVALID_VERSION_BYTE for P2SH address', () => {
      expect(validateP2PKH(validP2SH)).toEqual({ success: false, reason: 'INVALID_VERSION_BYTE' });
    });
    it('returns INVALID_LENGTH for Bech32 address', () => {
      expect(validateP2PKH(validBech32)).toEqual({ success: false, reason: 'INVALID_LENGTH' });
    });
    it('returns INVALID_CHECKSUM for P2PKH with invalid checksum', () => {
      expect(validateP2PKH('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN3')).toEqual({ success: false, reason: 'INVALID_CHECKSUM' });
    });
  });

  describe('validateP2SH', () => {
    it('returns success with type p2sh for valid P2SH', () => {
      expect(validateP2SH(validP2SH)).toEqual({ success: true, type: 'p2sh' });
    });
    it('returns INVALID_VERSION_BYTE for P2PKH address', () => {
      expect(validateP2SH(validP2PKH)).toEqual({ success: false, reason: 'INVALID_VERSION_BYTE' });
    });
    it('returns INVALID_CHECKSUM for P2SH with invalid checksum', () => {
      expect(validateP2SH('3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyD')).toEqual({ success: false, reason: 'INVALID_CHECKSUM' });
    });
  });

  describe('validateBech32', () => {
    it('returns success with type bech32 for valid bc1q (SegWit v0)', () => {
      expect(validateBech32(validBech32)).toEqual({ success: true, type: 'bech32' });
    });
    it('returns success with type bech32 for valid bc1p (Taproot)', () => {
      expect(validateBech32(validTaproot)).toEqual({ success: true, type: 'bech32' });
    });
    it('returns MIXED_CASE for P2PKH address (has mixed case)', () => {
      expect(validateBech32(validP2PKH)).toEqual({ success: false, reason: 'MIXED_CASE' });
    });
    it('returns INVALID_BECH32_FORMAT for invalid checksum', () => {
      expect(validateBech32('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlq')).toEqual({ success: false, reason: 'INVALID_BECH32_FORMAT' });
    });
  });
});
