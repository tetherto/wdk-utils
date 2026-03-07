import { validateSparkAddress } from '../src/address-validation/spark.js';

describe('spark', () => {
  const validBtc = 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh';
  const validAlphanumeric = 'a'.repeat(25);

  describe('validateSparkAddress', () => {
    it('returns success with type btc for Bitcoin address', () => {
      expect(validateSparkAddress(validBtc)).toEqual({ success: true, type: 'btc' });
    });
    it('returns success with type alphanumeric for 20-100 char alphanumeric', () => {
      expect(validateSparkAddress(validAlphanumeric)).toEqual({ success: true, type: 'alphanumeric' });
      expect(validateSparkAddress('A1b2C3' + 'x'.repeat(14))).toEqual({ success: true, type: 'alphanumeric' });
    });
    it('returns INVALID_FORMAT for alphanumeric shorter than 20', () => {
      expect(validateSparkAddress('a'.repeat(19))).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for alphanumeric longer than 100', () => {
      expect(validateSparkAddress('a'.repeat(101))).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for non-alphanumeric in long string', () => {
      expect(validateSparkAddress('a'.repeat(20) + '-')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for invalid address with special chars', () => {
      expect(validateSparkAddress('bad!')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT or EMPTY_ADDRESS for empty or non-string', () => {
      expect(validateSparkAddress('')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateSparkAddress(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
  });
});
