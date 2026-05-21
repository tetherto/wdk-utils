import { decode, encode, sign, validateLightningInvoice } from '../src/bolt11/index.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import fs from 'fs'

const MOCK_DATA = JSON.parse(fs.readFileSync('tests/helpers/bolt11-mocks.json', 'utf8'))
const MOCK_SUCCESS_DATA = MOCK_DATA.filter(v => v.success)
const MOCK_FAILURE_DATA = MOCK_DATA.filter(v => !v.success)

const MOCK_PRIVATE_KEY = new Uint8Array(32).fill(1)
const MOCK_PUB_KEY = secp256k1.getPublicKey(MOCK_PRIVATE_KEY, true)
const MOCK_PUB_KEY_HEX = Array.from(MOCK_PUB_KEY).map(b => b.toString(16).padStart(2, '0')).join('')

describe('BOLT11 Tests', () => {
  describe('validateLightningInvoice', () => {
    const validLnbc = 'lnbc100u1p5m3k6fpp5uk9rs7fdrvssehzthphfjvpc3t5hyacgrveskwqzwclrdsl0cjgsdqydp5scqzzsxqrrssrzjqvgptfurj3528snx6e3dtwepafxw5fpzdymw9pj20jj09sunnqmwqqqqqyqqqqqqqqqqqqqqqqqqqqqqjqnp4qtem70et4qm86lv449zcpqjn9nmamd6qrzm3wa3d7msnq2kx3yapwsp50c4l2z72hcmejj88en6eu2p8u2ypv87pw5pndzjjtclwaw0f7wds9qyyssqtqeqrvaaw92y7at9463vxhwkjdy7lpxet7h6g4vry8xyw4ar9yn8qq36dryntpf252v58c4hrf4g59z2pr25lhp06n7x4z7yltd022cqk7lc7e'

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

  describe('Decoding', () => {
    MOCK_SUCCESS_DATA.forEach((vector, i) => {
      it(`should correctly decode vector ${i} (${vector.invoice.substring(0, 15)}...)`, () => {
        const result = decode(vector.invoice)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.millisatoshis).toBe(vector.data.millisatoshis)
          expect(result.data.timestamp).toBe(vector.data.timestamp)
          expect(result.data.payeeNodeKey).toBe(vector.data.payeeNodeKey)
          expect(result.data.signature).toBe(vector.data.signature)
          expect(result.data.recoveryFlag).toBe(vector.data.recoveryFlag)

          const IMPORTANT_TAGS = ['payment_hash', 'expiry', 'description', 'purpose_commit_hash', 'payment_secret']
          IMPORTANT_TAGS.forEach(tagName => {
            const vectorTag = vector.data.tags.find(t => t.tagName === tagName)
            if (vectorTag) {
              const actualTag = result.data.tags.find(t => t.tagName === tagName)
              expect(actualTag).toBeDefined()
              expect(actualTag.data).toEqual(vectorTag.data)
            }
          })
        }
      })
    })

    MOCK_FAILURE_DATA.forEach((vector, i) => {
      it(`should fail to decode invalid vector ${i}`, () => {
        const result = decode(vector.invoice)
        expect(result.success).toBe(false)
      })
    })

    it('should return EMPTY_INVOICE for empty input', () => {
      expect(decode('')).toEqual({ success: false, reason: 'EMPTY_INVOICE' })
    })

    it('should fail on duplicate tags', () => {
      const invoice = 'lnbc10n1qqqqqqppp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqdqppqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqwck8v7'
      const result = decode(invoice)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('DECODING_FAILED')
    })

    it('should fail on missing description', () => {
      const invoice = 'lnbc10n1qqqqqqppp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqf99hhn'
      const result = decode(invoice)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('MISSING_DESCRIPTION')
    })

    it('should fail on mutually exclusive tags', () => {
      const invoice = 'lnbc10n1qqqqqqppp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqdqpphp5qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqdu6lnn'
      const result = decode(invoice)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('DECODING_FAILED')
    })

    it('should fail on truncated tag header', () => {
      const invoice = 'lnbc10n1qqqqqqppqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3pllef'
      const result = decode(invoice)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('TRUNCATED_TAG_HEADER')
    })

    it('should fail on truncated tag data', () => {
      const invoice = 'lnbc10n1qqqqqqppq2qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqegrwl2'
      const result = decode(invoice)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('TRUNCATED_TAG_DATA')
    })

    it('should fail on invalid tag length', () => {
      const invoice = 'lnbc10n1qqqqqqppqpqdqppqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr0e0fa'
      const result = decode(invoice)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('INVALID_TAG_LENGTH')
    })
  })

  describe('Encoding', () => {
    MOCK_SUCCESS_DATA.forEach((vector, i) => {
      it(`should correctly encode vector ${i}`, () => {
        const cleanTags = vector.data.tags
          .filter(t => t.tagName !== 'payee_node_key')
          .map(t => ({ tagName: t.tagName, data: t.data }))
        
        cleanTags.push({ tagName: 'payee_node_key', data: MOCK_PUB_KEY_HEX })

        const cleanData = {
          ...vector.data,
          tags: cleanTags,
          signature: undefined,
          recoveryFlag: undefined
        }

        const signResult = sign(cleanData, MOCK_PRIVATE_KEY)
        expect(signResult.success).toBe(true)

        const result = encode(signResult.data)
        expect(result.success).toBe(true)

        if (result.success) {
          const reDecoded = decode(result.data)
          expect(reDecoded.success).toBe(true)
          if (reDecoded.success) {
            expect(reDecoded.data.millisatoshis).toBe(vector.data.millisatoshis)
            expect(reDecoded.data.payeeNodeKey).toBe(MOCK_PUB_KEY_HEX)
          }
        }
      })
    })

    it('should fail to encode if signature is missing', () => {
      const dataWithoutSig = { ...MOCK_SUCCESS_DATA[0].data, signature: undefined }
      const result = encode(dataWithoutSig)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('MISSING_SIGNATURE')
    })
  })

  describe('Validation', () => {
    it('should fail when passed an unknown network', () => {
      const invalidData = { ...MOCK_SUCCESS_DATA[0].data, network: 'unknown-chain' }
      const result = encode(invalidData)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('INVALID_NETWORK')
    })

    it('should fail when amount is too large', () => {
      const largeAmount = (21_000_000n * 10n ** 11n + 1n).toString()
      const invalidData = { ...MOCK_SUCCESS_DATA[0].data, millisatoshis: largeAmount }
      const result = encode(invalidData)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('AMOUNT_TOO_LARGE')
    })

    it('should fail when timestamp is too large', () => {
      const largeTimestamp = Number(2n ** 35n + 1n)
      const invalidData = { ...MOCK_SUCCESS_DATA[0].data, timestamp: largeTimestamp }
      const result = encode(invalidData)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('TIMESTAMP_TOO_LARGE')
    })

    it('should support private key as hex string in sign()', () => {
      const TEST_PRIV_KEY_HEX = Array.from(MOCK_PRIVATE_KEY).map(b => b.toString(16).padStart(2, '0')).join('')
      const result = sign(MOCK_SUCCESS_DATA[0].data, TEST_PRIV_KEY_HEX)
      expect(result.success).toBe(true)
      expect(result.data.signature).toBeDefined()
    })

    it('should fail if both description and purpose_commit_hash are provided', () => {
      const invalidData = {
        ...MOCK_SUCCESS_DATA[0].data,
        tags: [
          { tagName: 'payment_hash', data: '00'.repeat(32) },
          { tagName: 'description', data: 'desc' },
          { tagName: 'purpose_commit_hash', data: '00'.repeat(32) }
        ]
      }
      const result = sign(invalidData, MOCK_PRIVATE_KEY)
      expect(result.success).toBe(false)
      expect(result.reason).toBe('MUTUALLY_EXCLUSIVE_TAGS')
    })

    it('should fail to decode if signature is slightly modified', () => {
      const vector = MOCK_SUCCESS_DATA[0]
      const invoice = vector.invoice
      // Modify a character in the signature part (last 104 words)
      const corrupted = invoice.substring(0, invoice.length - 10) + (invoice[invoice.length - 1] === 'q' ? 'p' : 'q') + invoice.substring(invoice.length - 9)
      const result = decode(corrupted)
      // It might fail checksum or pubkey mismatch
      expect(result.success).toBe(false)
    })
  })
})
