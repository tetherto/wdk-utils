import { validateSparkAddress } from '../src/address-validation/spark.js';

describe('spark', () => {
  const validSpark = 'spark1pgss8nf2kuw484d2u529edwjq4et7wqa7pj4pqdw0axprejy38reqeq0lxclux';
  const validAlphanumeric = 'a'.repeat(25);

  describe('validateSparkAddress', () => {
    it('returns success with type spark for spark1 bech32 address', () => {
      expect(validateSparkAddress(validSpark)).toEqual({ success: true, type: 'spark' });
    });
    it('returns INVALID_BECH32_FORMAT for spark1 prefix with invalid checksum', () => {
      expect(validateSparkAddress('spark1' + 'a'.repeat(20))).toEqual({ success: false, reason: 'INVALID_BECH32_FORMAT' });
    });
    it('returns MIXED_CASE for mixed case spark1 address', () => {
      expect(validateSparkAddress('Spark1pgss8nf2kuw484d2u529edwjq4et7wqa7pj4pqdw0axprejy38reqeq0lxclux')).toEqual({ success: false, reason: 'MIXED_CASE' });
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
    it('returns INVALID_FORMAT for empty or non-string', () => {
      expect(validateSparkAddress('')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateSparkAddress(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns EMPTY_ADDRESS for whitespace-only string', () => {
      expect(validateSparkAddress('   ')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' });
    });
  });
});
