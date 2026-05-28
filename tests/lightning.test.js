import {
  validateLightningAddress,
  validateLnurl,
  decodeLnurl
} from '../src/address-validation/lightning.js'
import { stripLightningPrefix } from '../src/address-validation/utils.js'

describe('lightning', () => {
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

