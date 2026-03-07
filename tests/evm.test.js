import { validateEVMAddress } from '../src/address-validation/evm.js';

describe('evm', () => {
  const validLowercase = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
  const validUppercase = '0x742D35CC6634C0532925A3B844BC454E4438F44E';
  const validChecksummed = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
  const invalidChecksum = '0x742d35CC6634C0532925a3b844Bc454e4438f44e';

  describe('validateEVMAddress', () => {
    it('accepts all-lowercase address', () => {
      expect(validateEVMAddress(validLowercase)).toEqual({ success: true, type: 'evm' });
    });
    it('accepts all-uppercase address', () => {
      expect(validateEVMAddress(validUppercase)).toEqual({ success: true, type: 'evm' });
    });
    it('accepts valid EIP-55 checksummed address', () => {
      expect(validateEVMAddress(validChecksummed)).toEqual({ success: true, type: 'evm' });
    });
    it('returns INVALID_CHECKSUM for wrong mixed case', () => {
      expect(validateEVMAddress(invalidChecksum)).toEqual({ success: false, reason: 'INVALID_CHECKSUM' });
    });
    it('returns INVALID_FORMAT for missing 0x', () => {
      expect(validateEVMAddress('742d35cc6634c0532925a3b844bc454e4438f44e')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for wrong length', () => {
      expect(validateEVMAddress('0x742d35cc')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for non-hex', () => {
      expect(validateEVMAddress('0x742d35cc6634c0532925a3b844bc454e4438f44z')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('returns INVALID_FORMAT for empty or non-string', () => {
      expect(validateEVMAddress('')).toEqual({ success: false, reason: 'INVALID_FORMAT' });
      expect(validateEVMAddress(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' });
    });
    it('trims whitespace', () => {
      expect(validateEVMAddress('  ' + validLowercase + '  ')).toEqual({ success: true, type: 'evm' });
    });
  });
});
