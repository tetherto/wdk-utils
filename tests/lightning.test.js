import {
  validateLightningInvoice,
  validateLightningAddress,
  validateLnurl,
  stripLightningPrefix
} from '../src/address-validation/lightning.js'

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

  const validLnbc = 'lnbc100u1p5m3k6fpp5uk9rs7fdrvssehzthphfjvpc3t5hyacgrveskwqzwclrdsl0cjgsdqydp5scqzzsxqrrssrzjqvgptfurj3528snx6e3dtwepafxw5fpzdymw9pj20jj09sunnqmwqqqqqyqqqqqqqqqqqqqqqqqqqqqqjqnp4qtem70et4qm86lv449zcpqjn9nmamd6qrzm3wa3d7msnq2kx3yapwsp50c4l2z72hcmejj88en6eu2p8u2ypv87pw5pndzjjtclwaw0f7wds9qyyssqtqeqrvaaw92y7at9463vxhwkjdy7lpxet7h6g4vry8xyw4ar9yn8qq36dryntpf252v58c4hrf4g59z2pr25lhp06n7x4z7yltd022cqk7lc7e'

  describe('validateLightningInvoice', () => {
    it('returns success for valid invoices', () => {
      expect(validateLightningInvoice(validLnbc)).toEqual({ success: true, type: 'invoice' })
    })

    it('returns success for a long, realistic invoice', () => {
      const longInvoice = 'lnbc1p5mg4kmpp5xh4a2kdx625hjc7f446ktn5pzq5ht2fztv0r4sqlhpw3xr406pmqsp5fy8p4h22ggwejpvs0xen6rdejpkvf4yxxzxnneyk8u52xhq3z7fsxq9z0rgqnp4qvyndeaqzman7h898jxm98dzkm0mlrsx36s93smrur7h0azyyuxc5rzjq25carzepgd4vqsyn44jrk85ezrpju92xyrk9apw4cdjh6yrwt5jgqqqqrt49lmtcqqqqqqqqqqq86qq9qrzjqw668wp0gj9vsx8dwpt7j4qv4m7zmkklnslzj0dwwwjz20v4ad6vtapyqr6zgqqqq8hxk2qqae4jsqyugqcqzpgdqq9qyyssqj8gyv9s2gftgg0nktqj8t87qam3wcn8nfadp3qjc935r4xuna77zc4g2zapmx55cjm3kyn6ff8khttnvxw4n6qe7dur3a6fqzpldx3gpky6f6z'
      expect(validateLightningInvoice(longInvoice)).toEqual({ success: true, type: 'invoice' })
    })

    it('strips "lightning:" prefix before validating', () => {
      expect(validateLightningInvoice('lightning:' + validLnbc)).toEqual({ success: true, type: 'invoice' })
    })

    it('returns INVALID_LENGTH for invoices shorter than 20 chars', () => {
      expect(validateLightningInvoice('lnbc1qyqsm94tzr')).toEqual({ success: false, reason: 'INVALID_LENGTH' })
    })

    it('returns INVALID_PREFIX for unknown prefixes', () => {
      expect(validateLightningInvoice('lnxx1' + 'x'.repeat(20))).toEqual({ success: false, reason: 'INVALID_PREFIX' })
    })

    it('returns INVALID_BECH32_FORMAT for invalid checksum', () => {
      const badChecksum = validLnbc.slice(0, -1) + 'q'
      expect(validateLightningInvoice(badChecksum)).toEqual({ success: false, reason: 'INVALID_BECH32_FORMAT' })
    })

    it('returns EMPTY_ADDRESS for empty or whitespace strings', () => {
      expect(validateLightningInvoice('')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
      expect(validateLightningInvoice('  ')).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
    })

    it('returns INVALID_FORMAT for non-string inputs', () => {
      expect(validateLightningInvoice(null)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
      expect(validateLightningInvoice(undefined)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })
  })

  describe('validateLnurl', () => {
    const validLnurl = 'lnurl1dp68gurn8ghj7ampd3kx2ar0veekzar0wd5xjtnrdakj7tnhv4kxctttdehhwm30d3h82unvwqhhxurj093k7mtxdae8gwfjnztwnf'

    it('returns success for a valid LNURL', () => {
      expect(validateLnurl(validLnurl)).toEqual({ success: true, type: 'lnurl' })
      expect(validateLnurl(validLnurl.toUpperCase())).toEqual({ success: true, type: 'lnurl' })
    })

    it('returns INVALID_PREFIX for a non-lnurl bech32 string', () => {
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

  describe('validateLightningAddress', () => {
    it('returns success for a valid email-like address', () => {
      expect(validateLightningAddress('sprycomfort92@waletofsatoshi.com')).toEqual({ success: true, type: 'address' })
      expect(validateLightningAddress('USER@DOMAIN.CO')).toEqual({ success: true, type: 'address' })
    })

    it('returns INVALID_FORMAT for addresses missing a dot in the domain', () => {
      expect(validateLightningAddress('user@localhost')).toEqual({ success: false, reason: 'INVALID_FORMAT' })
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

