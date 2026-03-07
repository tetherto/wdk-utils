import {
  validateLightningInvoice,
  validateLightningAddress,
  stripLightningPrefix,
} from '../src/address-validation/lightning.js';

describe('lightning', () => {
  describe('stripLightningPrefix', () => {
    it('strips lightning: prefix (case-insensitive)', () => {
      expect(stripLightningPrefix('lightning:lnbc1xxx')).toBe('lnbc1xxx');
      expect(stripLightningPrefix('LIGHTNING:lnbc1xxx')).toBe('lnbc1xxx');
    });
    it('returns unchanged if no prefix', () => {
      expect(stripLightningPrefix('lnbc1xxx')).toBe('lnbc1xxx');
    });
    it('handles empty or non-string', () => {
      expect(stripLightningPrefix('')).toBe('');
      expect(stripLightningPrefix(null)).toBe(null);
    });
  });

  const validLnbc = 'lnbc1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpht0z6z';
  const validLntb = 'lntb1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgp4m6vj4';
  const validLnbcrt = 'lnbcrt1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgphw244f';
  const validLni = 'lni1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpgwn9wp';

  describe('validateLightningInvoice', () => {
    it('returns success with type invoice for valid lnbc', () => {
      expect(validateLightningInvoice(validLnbc)).toEqual({ success: true, type: 'invoice' });
    });
    it('accepts lntb, lnbcrt, lni', () => {
      expect(validateLightningInvoice(validLntb)).toEqual({ success: true, type: 'invoice' });
      expect(validateLightningInvoice(validLnbcrt)).toEqual({ success: true, type: 'invoice' });
      expect(validateLightningInvoice(validLni)).toEqual({ success: true, type: 'invoice' });
    });
    it('returns INVALID_LENGTH for too short invoice', () => {
      expect(validateLightningInvoice('lnbc1qyqsm94tzr')).toEqual({ success: false, reason: 'INVALID_LENGTH' });
    });
    it('returns INVALID_PREFIX for non-invoice prefix', () => {
      expect(validateLightningInvoice('lnxx1' + 'x'.repeat(20))).toEqual({ success: false, reason: 'INVALID_PREFIX' });
    });
    it('returns INVALID_PREFIX for missing ln prefix', () => {
      expect(validateLightningInvoice('bc1' + 'x'.repeat(20))).toEqual({ success: false, reason: 'INVALID_PREFIX' });
    });
    it('returns INVALID_CHECKSUM for invalid checksum', () => {
      expect(validateLightningInvoice('lnbc1qyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpqyqszqgpht0z6q')).toEqual({ success: false, reason: 'INVALID_CHECKSUM' });
    });
    it('strips lightning: before validating', () => {
      expect(validateLightningInvoice('lightning:' + validLnbc)).toEqual({ success: true, type: 'invoice' });
    });
  });

  describe('validateLightningAddress', () => {
    it('returns success with type address for email with dot in domain', () => {
      expect(validateLightningAddress('user@getalby.com')).toEqual({ success: true, type: 'address' });
      expect(validateLightningAddress('u@a.co')).toEqual({ success: true, type: 'address' });
    });
    it('returns INVALID_FORMAT for missing dot in domain', () => {
      expect(validateLightningAddress('user@localhost')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for invalid format', () => {
      expect(validateLightningAddress('notanemail')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateLightningAddress('@domain.com')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateLightningAddress('user@')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
  });
});
