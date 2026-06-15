import { isBip21Request, parseBip21Request, encodeBip21Request } from '../src/bip21/index.js'

describe('bip21', () => {
  describe('isBip21Request', () => {
    it('returns true for a bare address URI', () => {
      expect(isBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH')).toBe(true)
    })

    it('returns true for a URI with query params', () => {
      expect(isBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.5&label=Alice')).toBe(true)
    })

    it('returns true regardless of scheme case', () => {
      expect(isBip21Request('BITCOIN:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH')).toBe(true)
      expect(isBip21Request('Bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH')).toBe(true)
    })

    it('returns false for wrong scheme', () => {
      expect(isBip21Request('ethereum:0xabc')).toBe(false)
      expect(isBip21Request('litecoin:Labc')).toBe(false)
    })

    it('returns false for non-string, null, undefined, or empty input', () => {
      expect(isBip21Request('')).toBe(false)
      expect(isBip21Request('  ')).toBe(false)
      expect(isBip21Request(null)).toBe(false)
      expect(isBip21Request(undefined)).toBe(false)
      expect(isBip21Request(42)).toBe(false)
    })

    it('returns false when nothing follows the colon', () => {
      expect(isBip21Request('bitcoin:')).toBe(false)
    })

    it('returns false when only whitespace follows the colon', () => {
      expect(isBip21Request('bitcoin:   ')).toBe(false)
    })

    it('returns false when address part is missing (only query string present)', () => {
      expect(isBip21Request('bitcoin:?amount=1')).toBe(false)
    })
  })

  describe('parseBip21Request', () => {
    it('parses a bare P2PKH address URI', () => {
      expect(parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH')).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH'
        }
      })
    })

    it('parses a bech32 address URI', () => {
      expect(parseBip21Request('bitcoin:bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq')).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'
        }
      })
    })

    it('parses a P2SH address URI', () => {
      expect(parseBip21Request('bitcoin:3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
        }
      })
    })

    it('is case-insensitive for the scheme', () => {
      expect(parseBip21Request('BITCOIN:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH')).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH'
        }
      })
    })

    it('returns INVALID_FORMAT for non-string input', () => {
      expect(parseBip21Request(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(parseBip21Request(undefined)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(parseBip21Request(42)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })

    it('returns INVALID_FORMAT for wrong scheme', () => {
      expect(parseBip21Request('ethereum:0xabc')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })

    it('returns INVALID_FORMAT when address is missing', () => {
      expect(parseBip21Request('bitcoin:')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(parseBip21Request('bitcoin:?amount=1')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })

    it('returns INVALID_ADDRESS for a malformed address', () => {
      expect(parseBip21Request('bitcoin:notanaddress')).toEqual({ success: false, reason: 'INVALID_ADDRESS' })
    })

    it('parses amount in decimal BTC', () => {
      expect(parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.5')).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
          amount: '0.5'
        }
      })
    })

    it('accepts amount with up to 8 decimal places', () => {
      expect(parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.00000001')).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
          amount: '0.00000001'
        }
      })
    })

    it('returns INVALID_AMOUNT for more than 8 decimal places', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.000000001')
      ).toEqual({ success: false, reason: 'INVALID_AMOUNT' })
    })

    it('returns INVALID_AMOUNT when amount exceeds 21 million BTC', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=21000001')
      ).toEqual({ success: false, reason: 'INVALID_AMOUNT' })
    })

    it('accepts amount equal to 21 million BTC', () => {
      expect(parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=21000000')).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
          amount: '21000000'
        }
      })
    })

    it('parses label and message with URL encoding', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?label=Alice&message=Invoice%20%23123')
      ).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
          label: 'Alice',
          message: 'Invoice #123'
        }
      })
    })

    it('treats + as a literal plus sign, not a space', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?label=A%2BB')
      ).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
          label: 'A+B'
        }
      })
    })

    it('parses all params together', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.01&label=Coffee&message=Thanks')
      ).toEqual({
        success: true,
        type: 'bip21',
        value: {
          address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
          amount: '0.01',
          label: 'Coffee',
          message: 'Thanks'
        }
      })
    })

    it('omits optional fields when not present', () => {
      const result = parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH')
      expect(result.success).toBe(true)
      expect(result.value).not.toHaveProperty('amount')
      expect(result.value).not.toHaveProperty('label')
      expect(result.value).not.toHaveProperty('message')
    })

    it('returns INVALID_AMOUNT for non-numeric amount', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=abc')
      ).toEqual({ success: false, reason: 'INVALID_AMOUNT' })
    })

    it('returns INVALID_AMOUNT for negative amount', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=-1')
      ).toEqual({ success: false, reason: 'INVALID_AMOUNT' })
    })

    it('returns INVALID_AMOUNT for scientific notation', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=1e-3')
      ).toEqual({ success: false, reason: 'INVALID_AMOUNT' })
    })

    it('returns UNSUPPORTED_REQUIRED_PARAM for any req- prefixed param', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?req-foo=bar')
      ).toEqual({ success: false, reason: 'UNSUPPORTED_REQUIRED_PARAM' })
    })

    it('returns UNSUPPORTED_REQUIRED_PARAM even when mixed with valid params', () => {
      expect(
        parseBip21Request('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.5&req-expiry=12345')
      ).toEqual({ success: false, reason: 'UNSUPPORTED_REQUIRED_PARAM' })
    })
  })

  describe('encodeBip21Request', () => {
    it('encodes a bare address', () => {
      expect(encodeBip21Request({ address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH' }))
        .toBe('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH')
    })

    it('encodes amount', () => {
      expect(encodeBip21Request({ address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH', amount: '0.5' }))
        .toBe('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.5')
    })

    it('encodes label and message with percent-encoding', () => {
      expect(encodeBip21Request({
        address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
        label: 'Invoice #123',
        message: 'Thank you'
      })).toBe('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?label=Invoice%20%23123&message=Thank%20you')
    })

    it('encodes all params together', () => {
      expect(encodeBip21Request({
        address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
        amount: '0.01',
        label: 'Coffee',
        message: 'Thanks'
      })).toBe('bitcoin:1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH?amount=0.01&label=Coffee&message=Thanks')
    })

    it('round-trips through parseBip21Request', () => {
      const request = {
        address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH',
        amount: '0.001',
        label: 'Alice',
        message: 'For coffee'
      }
      const encoded = encodeBip21Request(request)
      const parsed = parseBip21Request(encoded)
      expect(parsed).toEqual({ success: true, type: 'bip21', value: request })
    })

    it('throws INVALID_ADDRESS for a malformed address', () => {
      expect(() => encodeBip21Request({ address: 'notanaddress' })).toThrow('INVALID_ADDRESS')
    })

    it('throws INVALID_AMOUNT for more than 8 decimal places', () => {
      expect(() => encodeBip21Request({ address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH', amount: '0.000000001' })).toThrow('INVALID_AMOUNT')
    })

    it('throws INVALID_AMOUNT when amount exceeds 21 million BTC', () => {
      expect(() => encodeBip21Request({ address: '1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH', amount: '21000001' })).toThrow('INVALID_AMOUNT')
    })

    it('throws INVALID_REQUEST for non-object input', () => {
      expect(() => encodeBip21Request(null)).toThrow('INVALID_REQUEST')
      expect(() => encodeBip21Request('notanobject')).toThrow('INVALID_REQUEST')
    })
  })
})
