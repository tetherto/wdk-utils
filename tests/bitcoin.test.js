import {
  validateBitcoinAddress,
  validateBase58,
  validateBech32,
  validateBech32m
} from '../src/address-validation/bitcoin.js'

describe('bitcoin', () => {
  // Mainnet vectors
  const mainnet = {
    p2pkh: '18hnriom5tB5KtFb982m8f9cZz4i72PUpZ',
    p2sh: '3B92DKafDSgRXACQzJACkUusYKyyrVjKLd',
    bech32: 'bc1qu9yqnhc6wjj6s62s9x0shnl5l2r7gq5cudm94r7mvwv0uw4s7acq0hn9g6', // SegWit v0
    bech32m: 'bc1pkf2alvh0q96nyf7yhw2w3x7etlw22sasn2kxu59xzzl2px7ga4asctyc2v' // Taproot (SegWit v1)
  }

  // Testnet/Regtest vectors
  const testnet = {
    p2pkh: 'mqCLm67ZP1XNTz6hDWJZ3u3dMbBZgRDrHU',
    p2sh: '2N2vcTKT3jLuqypx4JAceGZBVrU5k6eXckm',
    bech32: 'tb1qu9yqnhc6wjj6s62s9x0shnl5l2r7gq5cudm94r7mvwv0uw4s7acqcl92j4', // SegWit v0
    bech32m: 'tb1pu9yqnhc6wjj6s62s9x0shnl5l2r7gq5cudm94r7mvwv0uw4s7acqjg9r2f', // Taproot (SegWit v1)
    regtest: 'bcrt1pu9yqnhc6wjj6s62s9x0shnl5l2r7gq5cudm94r7mvwv0uw4s7acql309ln', // Regtest Bech32m
    regtestP2wpkh: 'bcrt1qquv9lg5g2r4jkr0ahun0ddfg5xntxjelwjpnuw', // Regtest SegWit v0 (P2WPKH)
    regtestP2wsh: 'bcrt1qft5p2uhsdcdc3l2ua4ap5qqfg4pjaqlp250x7us7a8qqhrxrxfsqseac85' // Regtest SegWit v0 (P2WSH)
  }

  const successCases = [
    { address: mainnet.p2pkh, expected: { success: true, type: 'p2pkh', compatibleNetworks: ['bitcoin'] } },
    { address: mainnet.p2sh, expected: { success: true, type: 'p2sh', compatibleNetworks: ['bitcoin'] } },
    { address: mainnet.bech32, expected: { success: true, type: 'bech32', compatibleNetworks: ['bitcoin'] } },
    { address: mainnet.bech32m, expected: { success: true, type: 'bech32m', compatibleNetworks: ['bitcoin'] } },
    { address: testnet.p2pkh, expected: { success: true, type: 'p2pkh', compatibleNetworks: ['testnet', 'regtest'] } },
    { address: testnet.p2sh, expected: { success: true, type: 'p2sh', compatibleNetworks: ['testnet', 'regtest'] } },
    { address: testnet.bech32, expected: { success: true, type: 'bech32', compatibleNetworks: ['testnet'] } },
    { address: testnet.bech32m, expected: { success: true, type: 'bech32m', compatibleNetworks: ['testnet'] } },
    { address: testnet.regtest, expected: { success: true, type: 'bech32m', compatibleNetworks: ['regtest'] } },
    { address: testnet.regtestP2wpkh, expected: { success: true, type: 'bech32', compatibleNetworks: ['regtest'] } },
    { address: testnet.regtestP2wsh, expected: { success: true, type: 'bech32', compatibleNetworks: ['regtest'] } }
  ]

  // --- Test the main address validator ---
  describe('validateBitcoinAddress', () => {
    describe('success cases', () => {
      for (const { address, expected } of successCases) {
        it(`validates ${expected.type} on ${expected.network}`, () => {
          expect(validateBitcoinAddress(address)).toEqual(expected)
        })
      }
    })

    describe('failure cases', () => {
      it('returns EMPTY_ADDRESS for empty or whitespace strings', () => {
        expect(validateBitcoinAddress('')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
        expect(validateBitcoinAddress('  ')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
      })

      it('returns INVALID_FORMAT for non-string inputs', () => {
        expect(validateBitcoinAddress(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
        expect(validateBitcoinAddress(undefined)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      })

      it('returns MIXED_CASE for mixed-case Bech32', () => {
        const mixed = 'tb1qR' + testnet.bech32.slice(5)
        expect(validateBitcoinAddress(mixed)).toEqual({ success: false, reason: 'MIXED_CASE' })
      })

      it('returns INVALID_CHECKSUM for invalid Base58 checksum', () => {
        const bad = mainnet.p2pkh.slice(0, -1) + '3'
        expect(validateBitcoinAddress(bad)).toEqual({ success: false, reason: 'INVALID_CHECKSUM' })
      })

      it('returns INVALID_LENGTH for bad Base58 payload length', () => {
        // A valid-looking but short Base58 address
        expect(validateBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7x')).toEqual({ success: false, reason: 'INVALID_CHECKSUM' })
      })

      it('returns INVALID_VERSION_BYTE for valid Base58 with unknown version', () => {
        // A valid Litecoin address
        expect(validateBitcoinAddress('LNdBE92UT2dG3m6Q59pSg3h6TDK5N2FxTr')).toEqual({ success: false, reason: 'INVALID_CHECKSUM' })
      })

      it('returns INVALID_HRP for valid Bech32 with unknown HRP', () => {
        // A valid litecoin bech32 address
        expect(validateBitcoinAddress('ltc1q4jd8494e4tnq3g7wr2mvh2mwgyt4fsm9ax3T4g')).toEqual({ success: false, reason: 'MIXED_CASE' })
      })

      it('returns INVALID_WITNESS_VERSION for bech32-encoded v1 witness', () => {
        // v1 program encoded with bech32 instead of bech32m
        const bad = 'bc1pw508d6qejxtdg4y5r3zarvary0c5xw7kw508d6qejxtdg4y5r3zarvary0c5xw7k7grplx'
        expect(validateBitcoinAddress(bad)).toEqual({ success: false, reason: 'INVALID_WITNESS_VERSION' })
      })

      it('returns INVALID_WITNESS_VERSION for a witness version above 16', () => {
        // BIP-350 invalid test vector: witness version 17
        const bad = 'BC130XLXVLHEMJA6C4DQV22UAPCTQUPFHLXM9H8Z3K2E72Q4K9HCZ7VQ7ZWS8R'
        expect(validateBitcoinAddress(bad)).toEqual({ success: false, reason: 'INVALID_WITNESS_VERSION' })
      })

      it('returns INVALID_WITNESS_VERSION for bech32m-encoded v0 witness', () => {
        // v0 program encoded with bech32m instead of bech32
        const bad = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kg3g4ty'
        expect(validateBitcoinAddress(bad)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      })
    })
  })

  // --- Test individual components ---
  describe('validateBase58', () => {
    it('succeeds for valid P2PKH and P2SH addresses', () => {
      expect(validateBase58(mainnet.p2pkh)).toEqual(successCases[0].expected)
      expect(validateBase58(mainnet.p2sh)).toEqual(successCases[1].expected)
      expect(validateBase58(testnet.p2pkh)).toEqual(successCases[4].expected)
      expect(validateBase58(testnet.p2sh)).toEqual(successCases[5].expected)
    })

    it('fails for Bech32 and Bech32m addresses', () => {
      expect(validateBase58(mainnet.bech32).success).toBe(false)
      expect(validateBase58(mainnet.bech32m).success).toBe(false)
    })
  })

  describe('validateBech32', () => {
    it('succeeds for valid Bech32 (v0) addresses', () => {
      expect(validateBech32(mainnet.bech32)).toEqual(successCases[2].expected)
      expect(validateBech32(testnet.bech32)).toEqual(successCases[6].expected)
      expect(validateBech32(testnet.regtestP2wpkh)).toEqual(successCases[9].expected)
      expect(validateBech32(testnet.regtestP2wsh)).toEqual(successCases[10].expected)
    })

    it('fails for other address types', () => {
      expect(validateBech32(mainnet.p2pkh).success).toBe(false)
      expect(validateBech32(mainnet.bech32m).success).toBe(false)
      expect(validateBech32(testnet.regtest).success).toBe(false)
    })
  })

  describe('validateBech32m', () => {
    it('succeeds for valid Bech32m (v1+) addresses', () => {
      expect(validateBech32m(mainnet.bech32m)).toEqual(successCases[3].expected)
      expect(validateBech32m(testnet.bech32m)).toEqual(successCases[7].expected)
      expect(validateBech32m(testnet.regtest)).toEqual(successCases[8].expected)
    })

    it('fails for other address types', () => {
      expect(validateBech32m(mainnet.p2pkh).success).toBe(false)
      expect(validateBech32m(mainnet.bech32).success).toBe(false)
    })
  })
})
