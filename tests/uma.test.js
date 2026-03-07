import {
  validateUmaAddress,
  resolveUmaUsername,
} from '../src/address-validation/uma.js';

describe('uma', () => {
  const validUma = '$you@uma.money';
  const validUma2 = '$alice@wallet.com';

  describe('validateUmaAddress', () => {
    it('returns success with type uma for valid UMA', () => {
      expect(validateUmaAddress(validUma)).toEqual({ success: true, type: 'uma' });
    });
    it('accepts other valid UMA formats', () => {
      expect(validateUmaAddress(validUma2)).toEqual({ success: true, type: 'uma' });
      expect(validateUmaAddress('$x@a.co')).toEqual({ success: true, type: 'uma' });
    });
    it('returns INVALID_FORMAT for missing $', () => {
      expect(validateUmaAddress('you@uma.money')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for invalid format', () => {
      expect(validateUmaAddress('$no-at-sign')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateUmaAddress('$@domain.com')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateUmaAddress('$user@nodot')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateUmaAddress('')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateUmaAddress(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('trims input', () => {
      expect(validateUmaAddress('  ' + validUma + '  ')).toEqual({ success: true, type: 'uma' });
    });
  });

  describe('resolveUmaUsername', () => {
    it('resolves UMA into localPart, domain, and lightningAddress', () => {
      expect(resolveUmaUsername(validUma)).toEqual({
        localPart: 'you',
        domain: 'uma.money',
        lightningAddress: 'you@uma.money',
      });
      expect(resolveUmaUsername(validUma2)).toEqual({
        localPart: 'alice',
        domain: 'wallet.com',
        lightningAddress: 'alice@wallet.com',
      });
    });
    it('returns null for invalid UMA', () => {
      expect(resolveUmaUsername('you@uma.money')).toBe(null);
      expect(resolveUmaUsername('')).toBe(null);
      expect(resolveUmaUsername(null)).toBe(null);
      expect(resolveUmaUsername('$bad')).toBe(null);
    });
    it('trims input', () => {
      expect(resolveUmaUsername('  $you@uma.money  ')).toEqual({
        localPart: 'you',
        domain: 'uma.money',
        lightningAddress: 'you@uma.money',
      });
    });
  });
});
