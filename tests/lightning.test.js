import { bech32 } from '@scure/base'
import {
  validateLightningAddress,
  validateLnurl,
  decodeLnurl
} from '../src/address-validation/lightning.js'
import { stripLightningPrefix } from '../src/address-validation/utils.js'

describe('lightning', () => {
  const encodeLnurl = (url) => bech32.encode('lnurl', bech32.toWords(new TextEncoder().encode(url)), 2000).toUpperCase()

  const UNSUPPORTED_URL_CASES = [
    ['a plain http URL', 'http://pay.example.com/lnurlp/alice'],
    ['an http URL whose host only contains .onion', 'http://evil.onion.example.com/lnurlp/alice'],
    ['a file URL', 'file:///etc/passwd'],
    ['a javascript URL', 'javascript:alert(1)'],
    ['a string that is not a URL', 'not a url']
  ]

  const ONION_URL = 'http://pay3xample5onion2addr6ssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion/lnurlp/alice'

  const EXCESS_PADDING_LNURL = 'lnurl1a2626vx'

  describe('stripLightningPrefix', () => {
    it('strips lightning: prefix (case-insensitive)', () => {
      expect(stripLightningPrefix('lightning:lnbc1xxx')).toBe('lnbc1xxx')
      expect(stripLightningPrefix('LIGHTNING:lnbc1xxx')).toBe('lnbc1xxx')
      expect(stripLightningPrefix('  lightning: lnbc1xxx  ')).toBe('lnbc1xxx')
    })
    it('returns string unchanged if no prefix', () => {
      expect(stripLightningPrefix('lnbc1xxx')).toBe('lnbc1xxx')
    })
    it('handles invalid, empty or non-string inputs safely', () => {
      expect(stripLightningPrefix('')).toBe('')
      expect(stripLightningPrefix('  ')).toBe('')
      expect(stripLightningPrefix(null)).toBe('')
      expect(stripLightningPrefix(undefined)).toBe('')
      expect(stripLightningPrefix(123)).toBe('')
    })
  })

  describe('validateLnurl', () => {
    const validLnurl = 'lnurl1dp68gurn8ghj7ampd3kx2ar0veekzar0wd5xjtnrdakj7tnhv4kxctttdehhwm30d3h82unvwqhhxurj093k7mtxdae8gwfjnztwnf'

    it('returns success for a valid LNURL', () => {
      expect(validateLnurl(validLnurl)).toEqual({ success: true, type: 'lnurl' })
      expect(validateLnurl(validLnurl.toUpperCase())).toEqual({ success: true, type: 'lnurl' })
    })

    it('returns success for an LNURL encoding an http URL of an onion host', () => {
      expect(validateLnurl(encodeLnurl(ONION_URL))).toEqual({ success: true, type: 'lnurl' })
    })

    it.each(UNSUPPORTED_URL_CASES)('returns UNSUPPORTED_URL for an LNURL encoding %s', (_, url) => {
      expect(validateLnurl(encodeLnurl(url))).toEqual({ success: false, reason: 'UNSUPPORTED_URL' })
    })

    it('returns INVALID_BECH32_FORMAT when the payload is not whole bytes', () => {
      expect(validateLnurl(EXCESS_PADDING_LNURL)).toEqual({ success: false, reason: 'INVALID_BECH32_FORMAT' })
    })

    it('returns INVALID_PREFIX for a non-lnurl bech32 string', () => {
      const validLnbc = 'lnbc100u1p5m3k6fpp5uk9rs7fdrvssehzthphfjvpc3t5hyacgrveskwqzwclrdsl0cjgsdqydp5scqzzsxqrrssrzjqvgptfurj3528snx6e3dtwepafxw5fpzdymw9pj20jj09sunnqmwqqqqqyqqqqqqqqqqqqqqqqqqqqqqjqnp4qtem70et4qm86lv449zcpqjn9nmamd6qrzm3wa3d7msnq2kx3yapwsp50c4l2z72hcmejj88en6eu2p8u2ypv87pw5pndzjjtclwaw0f7wds9qyyssqtqeqrvaaw92y7at9463vxhwkjdy7lpxet7h6g4vry8xyw4ar9yn8qq36dryntpf252v58c4hrf4g59z2pr25lhp06n7x4z7yltd022cqk7lc7e'
      expect(validateLnurl(validLnbc)).toEqual({ success: false, reason: 'INVALID_PREFIX' })
    })

    it('returns INVALID_BECH32_FORMAT for an invalid checksum', () => {
      const badChecksum = validLnurl.slice(0, -1) + 'q'
      expect(validateLnurl(badChecksum)).toEqual({ success: false, reason: 'INVALID_BECH32_FORMAT' })
    })

    it('returns EMPTY_ADDRESS for empty or whitespace strings', () => {
      expect(validateLnurl('')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
      expect(validateLnurl('  ')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
    })

    it('returns INVALID_FORMAT for non-string inputs', () => {
      expect(validateLnurl(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(validateLnurl(undefined)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })
  })

  describe('decodeLnurl', () => {
    const specLnurl = 'lnurl1dp68gurn8ghj7ampd3kx2ar0veekzar0wd5xjtnrdakj7tnhv4kxctttdehhwm30d3h82unvwqhkcctwva6kjerv09exjcejxyt4m3me'
    const specUrl = 'https://walletofsatoshi.com/.well-known/lnurlp/languidlyric21'

    it('should decode a valid LNURL from the spec', () => {
      const result = decodeLnurl(specLnurl)
      expect(result).toEqual({ success: true, type: 'lnurl', data: specUrl })
    })

    it('should decode a valid LNURL with lightning: prefix', () => {
      const result = decodeLnurl('lightning:' + specLnurl)
      expect(result).toEqual({ success: true, type: 'lnurl', data: specUrl })
    })

    it('should decode a lowercase LNURL', () => {
      const result = decodeLnurl(specLnurl.toLowerCase())
      expect(result).toEqual({ success: true, type: 'lnurl', data: specUrl })
    })

    it('should return INVALID_PREFIX for a non-lnurl prefix', () => {
      // Valid bech32 but wrong prefix
      const result = decodeLnurl('abcd1qpzry9x8gf2tvdw0s3jn54khce6mua7lmqqqxy')
      expect(result).toEqual({ success: false, reason: 'INVALID_PREFIX' })
    })

    it.each([
      ['an uppercase https URL', 'HTTPS://PAY.EXAMPLE.COM/lnurlp/alice', 'https://pay.example.com/lnurlp/alice'],
      ['a URL with no path', 'https://pay.example.com', 'https://pay.example.com/'],
      ['a URL with a relative path segment', 'https://pay.example.com/../lnurlp/alice', 'https://pay.example.com/lnurlp/alice'],
      ['a URL with the default port', 'https://pay.example.com:443/lnurlp/alice', 'https://pay.example.com/lnurlp/alice'],
      ['a URL with a unicode host', 'https://\u043f\u0440\u0438\u043c\u0435\u0440.\u0440\u0444/lnurlp/alice', 'https://xn--e1afmkfd.xn--p1ai/lnurlp/alice'],
      ['a URL with a fragment', 'https://pay.example.com/lnurlp/alice#frag', 'https://pay.example.com/lnurlp/alice#frag'],
      ['an http URL of an onion host', 'http://pay3xample5onion2addr6ssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion/lnurlp/alice', 'http://pay3xample5onion2addr6ssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion/lnurlp/alice'],
      ['an http URL of an onion host with a port', 'http://pay3xample5onion2addr6ssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion:8080/lnurlp/alice', 'http://pay3xample5onion2addr6ssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion:8080/lnurlp/alice'],
      ['an http URL of an onion host with a trailing dot', 'http://pay3xample5onion2addr6ssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion./lnurlp/alice', 'http://pay3xample5onion2addr6ssaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.onion./lnurlp/alice'],
      ['an https URL of a loopback address, which the decoder does not check', 'https://127.0.0.1:8545/', 'https://127.0.0.1:8545/'],
      ['an https URL of a link-local address, which the decoder does not check', 'https://169.254.169.254/latest/meta-data/', 'https://169.254.169.254/latest/meta-data/']
    ])('should decode %s', (_, url, expected) => {
      expect(decodeLnurl(encodeLnurl(url))).toEqual({ success: true, type: 'lnurl', data: expected })
    })

    it.each(UNSUPPORTED_URL_CASES)('should return UNSUPPORTED_URL for %s', (_, url) => {
      expect(decodeLnurl(encodeLnurl(url))).toEqual({ success: false, reason: 'UNSUPPORTED_URL' })
    })

    it('should return INVALID_BECH32_FORMAT when the payload is not whole bytes', () => {
      expect(decodeLnurl(EXCESS_PADDING_LNURL)).toEqual({ success: false, reason: 'INVALID_BECH32_FORMAT' })
    })

    it.each([
      ['an onion URL', ONION_URL],
      ['an https URL', 'https://pay.example.com/lnurlp/alice'],
      ...UNSUPPORTED_URL_CASES.map(([label, url]) => [label, url])
    ])('should agree with validateLnurl on %s', (_, url) => {
      const lnurl = encodeLnurl(url)
      const validation = validateLnurl(lnurl)
      const decoding = decodeLnurl(lnurl)

      expect(validation.success).toBe(decoding.success)
      expect(validation.reason).toBe(decoding.reason)
    })

    it('should return INVALID_BECH32_FORMAT for an invalid checksum', () => {
      const result = decodeLnurl(specLnurl.slice(0, -1) + (specLnurl.endsWith('a') ? 'b' : 'a'))
      expect(result.success).toBe(false)
      expect(result.reason).toBe('INVALID_BECH32_FORMAT')
    })

    it('should return EMPTY_ADDRESS for empty string', () => {
      expect(decodeLnurl('')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
    })

    it('should return EMPTY_ADDRESS for string that is empty after stripping prefix', () => {
      expect(decodeLnurl('lightning:')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
      expect(decodeLnurl('lightning:  ')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
    })
  })

  describe('validateLightningAddress', () => {
    it('returns success for a valid email-like address', () => {
      expect(validateLightningAddress('sprycomfort92@waletofsatoshi.com')).toEqual({ success: true, type: 'address' })
      expect(validateLightningAddress('USER@DOMAIN.CO')).toEqual({ success: true, type: 'address' })
    })

    it('returns INVALID_FORMAT for addresses missing a dot in the domain', () => {
      expect(validateLightningAddress('user@localhost')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })

    it('returns INVALID_FORMAT for invalid characters or structure', () => {
      expect(validateLightningAddress('user%name@domain.com')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(validateLightningAddress('user!name@domain.com')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(validateLightningAddress('user@dom#ain.com')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(validateLightningAddress('user@domain')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })

    it('returns INVALID_FORMAT for other invalid formats', () => {
      expect(validateLightningAddress('notanemail')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(validateLightningAddress('@domain.com')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })

    it('returns EMPTY_ADDRESS for empty or whitespace strings', () => {
      expect(validateLightningAddress('')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
      expect(validateLightningAddress('  ')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
    })

    it('returns INVALID_FORMAT for non-string inputs', () => {
      expect(validateLightningAddress(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(validateLightningAddress(undefined)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })
  })
})

