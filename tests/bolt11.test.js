import { decode, encode, sign, validateLightningInvoice } from '../src/bolt11/index.js'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bech32 } from '@scure/base'
import fs from 'fs'
import * as bolt11 from 'bolt11'

const MOCK_DATA = JSON.parse(fs.readFileSync('tests/helpers/bolt11-mocks.json', 'utf8'))
const MOCK_SUCCESS_DATA = MOCK_DATA.filter(v => v.success)
const MOCK_FAILURE_DATA = MOCK_DATA.filter(v => !v.success)

const MOCK_PRIVATE_KEY = new Uint8Array(32).fill(1)
const MOCK_PUB_KEY = secp256k1.getPublicKey(MOCK_PRIVATE_KEY, true)
const MOCK_PUB_KEY_HEX = Array.from(MOCK_PUB_KEY).map(b => b.toString(16).padStart(2, '0')).join('')

// Insert raw tagged words before the known fields, then let the independent
// bolt11 library sign the complete payload independently of our encoder.
function invoiceWithRawTags (tagWords) {
  const unsigned = bolt11.encode({
    timestamp: 1496314658,
    tags: [
      { tagName: 'payment_hash', data: '00'.repeat(32) },
      { tagName: 'description', data: 'raw tags' },
      { tagName: 'payee_node_key', data: MOCK_PUB_KEY_HEX }
    ]
  }, false)
  const { prefix, words } = bech32.decode(unsigned.wordsTemp, false)
  unsigned.wordsTemp = bech32.encode(prefix, [...words.slice(0, 7), ...tagWords, ...words.slice(7)], false)
  return bolt11.sign(unsigned, Buffer.from(MOCK_PRIVATE_KEY).toString('hex')).paymentRequest
}

describe('BOLT11 Tests', () => {
  describe('Metadata and unknown tags', () => {
    it('decodes the official payment metadata vector as hex', () => {
      // https://github.com/lightning/bolts/blob/master/11-payment-encoding.md
      // "Please send 0.01 BTC with payment metadata 0x01fafaf0"
      const invoice = 'lnbc10m1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdp9wpshjmt9de6zqmt9w3skgct5vysxjmnnd9jx2mq8q8a04uqsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q2gqqqqqqsgq7hf8he7ecf7n4ffphs6awl9t6676rrclv9ckg3d3ncn7fct63p6s365duk5wrk202cfy3aj5xnnp5gs3vrdvruverwwq7yzhkf5a3xqpd05wjc'
      const result = decode(invoice)
      expect(result.success).toBe(true)
      expect(result.data.tags.find(t => t.tagName === 'metadata')).toEqual({
        tagName: 'metadata', data: '01fafaf0'
      })
    })

    it.each(['', '00', '01fafaf0', '00ff'.repeat(32)])('round trips metadata %s', (metadata) => {
      const signed = sign({
        network: 'bitcoin',
        timestamp: 1496314658,
        tags: [
          { tagName: 'payment_hash', data: '00'.repeat(32) },
          { tagName: 'description', data: 'metadata' },
          { tagName: 'metadata', data: metadata }
        ]
      }, MOCK_PRIVATE_KEY)
      expect(signed.success).toBe(true)
      const encoded = encode(signed.data)
      expect(encoded.success).toBe(true)
      const decoded = decode(encoded.data)
      expect(decoded.success).toBe(true)
      expect(decoded.data.tags.find(t => t.tagName === 'metadata').data).toBe(metadata)
      const oracle = bolt11.decode(encoded.data)
      const rawMetadata = oracle.tags.find(t => t.tagName === 'unknownTag' && t.data.tagCode === 27)
      expect(bech32.decode(rawMetadata.data.words, false).words).toEqual(bech32.toWords(Buffer.from(metadata, 'hex')))
      expect(oracle.payeeNodeKey).toBe(MOCK_PUB_KEY_HEX)
    })

    it.each([[], [31], [0, 31, 4], Array.from({ length: 40 }, (_, i) => i % 32)].map(words => [words]))(
      'preserves unknown tag words %j without interpreting padding', (words) => {
        const invoice = invoiceWithRawTags([2, words.length >> 5, words.length & 31, ...words])
        const result = decode(invoice)
        expect(result.success).toBe(true)
        expect(result.data.tags[0]).toEqual({ tagName: 'unknown_2', data: words })
        expect(result.data.tags[1]).toEqual({ tagName: 'payment_hash', data: '00'.repeat(32) })
        expect(result.data.payeeNodeKey).toBe(MOCK_PUB_KEY_HEX)
        const oracle = bolt11.decode(invoice).tags[0]
        expect(oracle.data.tagCode).toBe(2)
        expect(bech32.decode(oracle.data.words, false).words).toEqual(words)
      }
    )

    it.each([[], [31], [0, 31, 4], Array.from({ length: 1023 }, (_, i) => i % 32)].map(words => [words.length, words]))(
      're-encodes %i signed unknown words without changing the invoice', (_, words) => {
        const invoice = invoiceWithRawTags([2, words.length >> 5, words.length & 31, ...words])
        const decoded = decode(invoice)
        expect(decoded.success).toBe(true)
        expect(encode(decoded.data)).toEqual({ success: true, type: 'invoice', data: invoice })
        const signed = sign(decoded.data, MOCK_PRIVATE_KEY)
        expect(signed.success).toBe(true)
        const encoded = encode(signed.data)
        expect(encoded.success).toBe(true)
        expect(decode(encoded.data).data.tags).toEqual(decoded.data.tags)
      }
    )

    it.each([3600, 7200])('preserves an explicit expiry of %i when re-encoding unknown tags', (expiry) => {
      const decoded = decode(invoiceWithRawTags([2, 0, 1, 31]))
      decoded.data.tags.push({ tagName: 'expiry', data: expiry })
      const signed = sign(decoded.data, MOCK_PRIVATE_KEY)
      expect(signed.success).toBe(true)
      const encoded = encode(signed.data)
      expect(encoded.success).toBe(true)
      const roundTrip = decode(encoded.data)
      expect(roundTrip.success).toBe(true)
      expect(roundTrip.data.tags.find(tag => tag.tagName === 'expiry').data).toBe(expiry)
      expect(encode(roundTrip.data)).toEqual(encoded)
    })

    it.each(['unknown_-1', 'unknown_32', 'unknown_02', 'unknown_1', 'unknown_27', 'unrecognized'])(
      'rejects invalid or known tag code aliases: %s', (tagName) => {
        const decoded = decode(invoiceWithRawTags([2, 0, 1, 31]))
        decoded.data.tags[0] = { tagName, data: [31] }
        expect(encode(decoded.data)).toEqual({
          success: false, reason: `ENCODE_TAG_FAILED: ${tagName} (UNKNOWN_TAG)`
        })
      }
    )

    it.each([[[-1]], [[32]], [[1.5]], [[NaN]], [['1']], [new Array(1)], ['1f'], [new Uint8Array([31])]])(
      'rejects unknown payloads that are not arrays of 5-bit integers: %j', (data) => {
        const decoded = decode(invoiceWithRawTags([2, 0, 1, 31]))
        decoded.data.tags[0].data = data
        expect(encode(decoded.data)).toEqual({
          success: false, reason: 'ENCODE_TAG_FAILED: unknown_2 (INVALID_TAG_DATA)'
        })
      }
    )

    it('rejects unknown data exceeding the 10-bit length field', () => {
      const decoded = decode(invoiceWithRawTags([2, 0, 1, 31]))
      decoded.data.tags[0].data = Array(1024).fill(0)
      expect(encode(decoded.data)).toEqual({
        success: false, reason: 'ENCODE_TAG_FAILED: unknown_2 (TAG_DATA_TOO_LONG)'
      })
    })

    it('preserves repeated unknown codes in invoice order', () => {
      const invoice = invoiceWithRawTags([2, 0, 1, 31, 31, 0, 0, 2, 0, 2, 0, 5])
      const result = decode(invoice)
      expect(encode(result.data)).toEqual({ success: true, type: 'invoice', data: invoice })
      expect(result.success).toBe(true)
      expect(result.data.tags.slice(0, 3)).toEqual([
        { tagName: 'unknown_2', data: [31] },
        { tagName: 'unknown_31', data: [] },
        { tagName: 'unknown_2', data: [0, 5] }
      ])
    })
  })

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
      it(`should correctly decode invoice ${i} (${vector.invoice.substring(0, 15)}...)`, () => {
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
    })

    it('should fail on truncated tag header', () => {
      const invoice = 'lnbc10n1qqqqqqppqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3pllef'
      const result = decode(invoice)
      expect(result.success).toBe(false)
    })

    it('should fail on truncated tag data', () => {
      const invoice = 'lnbc10n1qqqqqqppq2qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqegrwl2'
      const result = decode(invoice)
      expect(result.success).toBe(false)
    })

    it('should fail on invalid tag length', () => {
      const invoice = 'lnbc10n1qqqqqqppqpqdqppqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr0e0fa'
      const result = decode(invoice)
      expect(result.success).toBe(false)
    })
  })

  describe('Encoding', () => {
    MOCK_SUCCESS_DATA.forEach((vector, i) => {
      it(`should correctly encode vector ${i}`, () => {
        const decodedOriginal = decode(vector.invoice)
        expect(decodedOriginal.success).toBe(true)

        const cleanTags = decodedOriginal.data.tags
          .filter(t => t.tagName !== 'payee_node_key')
          .map(t => ({ tagName: t.tagName, data: t.data }))

        cleanTags.push({ tagName: 'payee_node_key', data: MOCK_PUB_KEY_HEX })

        const cleanData = {
          ...decodedOriginal.data,
          tags: cleanTags,
          signature: undefined,
          recoveryFlag: undefined
        }

        const signResult = sign(cleanData, MOCK_PRIVATE_KEY)
        if (!signResult.success) console.log(`Vector ${i} sign failed:`, signResult.reason)
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

    it('should fail when amount is zero or negative', () => {
      const zeroData = { ...MOCK_SUCCESS_DATA[0].data, millisatoshis: '0' }
      const zeroResult = encode(zeroData)
      expect(zeroResult.success).toBe(false)
      expect(zeroResult.reason).toBe('INVALID_AMOUNT')

      const negativeData = { ...MOCK_SUCCESS_DATA[0].data, millisatoshis: '-100' }
      const negativeResult = encode(negativeData)
      expect(negativeResult.success).toBe(false)
      expect(negativeResult.reason).toBe('INVALID_AMOUNT')
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

    it('should fail when tag data length exceeds 1024 words', () => {
      const longDescription = 'a'.repeat(640) // 640 bytes = 5120 bits. In 5-bit words: 5120 / 5 = 1024 words
      const invalidData = {
        ...MOCK_SUCCESS_DATA[0].data,
        tags: [
          { tagName: 'payment_hash', data: '00'.repeat(32) },
          { tagName: 'description', data: longDescription }
        ]
      }
      const result = sign(invalidData, MOCK_PRIVATE_KEY)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('TAG_DATA_TOO_LONG')
    })

    it('should correctly parse all HRP multipliers', () => {
      const multipliers = [
        { hrp: 'lnbc1m', msat: '100000000' },
        { hrp: 'lnbc1u', msat: '100000' },
        { hrp: 'lnbc1n', msat: '100' },
        { hrp: 'lnbc10p', msat: '1' }
      ]
      const originalInvoice = MOCK_SUCCESS_DATA[0].invoice
      const { words } = bech32.decode(originalInvoice, false)

      multipliers.forEach(({ hrp, msat }) => {
        // Re-encode with new HRP to get a valid checksum
        const invoice = bech32.encode(hrp, words, false)
        const result = decode(invoice)
        expect(result.success).toBe(true)
        expect(result.data.millisatoshis).toBe(msat)
      })
    })

    it('should fail to encode fallback address from a different network', () => {
      const mainnetAddress = 'bc1qwzrryqr3ja8w7hnja2spmkgfdcgvqwp5swz4af4ngsjecfz0w0pqud7k38'
      const testnetData = {
        ...MOCK_SUCCESS_DATA[0].data,
        network: 'testnet',
        tags: [
          { tagName: 'payment_hash', data: '00'.repeat(32) },
          { tagName: 'description', data: 'desc' },
          { tagName: 'fallback_address', data: mainnetAddress }
        ]
      }
      const result = sign(testnetData, MOCK_PRIVATE_KEY)
      expect(result.success).toBe(false)
      expect(result.reason).toContain('FALLBACK_ADDRESS_NETWORK_MISMATCH')
    })

    it('should support uppercase invoices', () => {
      const invoice = MOCK_SUCCESS_DATA[0].invoice.toUpperCase()
      const result = decode(invoice)
      expect(result.success).toBe(true)
      expect(result.data.network).toBe(MOCK_SUCCESS_DATA[0].data.network)
    })

    it('should correctly handle different witness versions in fallback addresses', () => {
      const testCases = [
        { address: 'bc1qwzrryqr3ja8w7hnja2spmkgfdcgvqwp5swz4af4ngsjecfz0w0pqud7k38', version: 0 },
        { address: 'bc1pv4n33wkgk90wh3ruc9s6mhqfnakrl8vt4dh4l9r86ga2zydjj3hsddxtps', version: 1 }
      ]
      testCases.forEach(({ address, version }) => {
        const data = {
          ...MOCK_SUCCESS_DATA[0].data,
          network: 'bitcoin',
          tags: [
            { tagName: 'payment_hash', data: '00'.repeat(32) },
            { tagName: 'description', data: 'desc' },
            { tagName: 'fallback_address', data: address }
          ]
        }
        const signed = sign(data, MOCK_PRIVATE_KEY)
        const encoded = encode(signed.data)
        const decoded = decode(encoded.data)
        const fallback = decoded.data.tags.find(t => t.tagName === 'fallback_address')
        expect(fallback.data.address).toBe(address)
        expect(fallback.data.version).toBe(version)
      })
    })
  })

  describe('Cross-Library Compatibility', () => {
    it('should be decodable by the "bolt11" library when encoded by us', () => {
      const paymentHash = "00".repeat(32)
      const description = "test invoice"
      const millisatoshis = "1000"
      const network = "bitcoin"

      const invoiceData = {
        network,
        millisatoshis,
        timestamp: Math.floor(Date.now() / 1000),
        tags: [
          { tagName: "payment_hash", data: paymentHash },
          { tagName: "description", data: description },
        ]
      }

      const signed = sign(invoiceData, MOCK_PRIVATE_KEY)
      expect(signed.success).toBe(true)

      const encoded = encode(signed.data)
      expect(encoded.success).toBe(true)

      const bolt11Decoded = bolt11.decode(encoded.data)
      expect(bolt11Decoded.millisatoshis).toBe(millisatoshis)
      expect(bolt11Decoded.tagsObject.payment_hash).toBe(paymentHash)
      expect(bolt11Decoded.tagsObject.description).toBe(description)
      expect(bolt11Decoded.payeeNodeKey).toBe(MOCK_PUB_KEY_HEX)
    })

    it('should be decodable by us when encoded by the "bolt11" library', () => {
      const paymentHash = "11".repeat(32)
      const description = "cross-lib test"
      const millisatoshis = "5000"

      const bolt11Data = {
        network: {
          bech32: "bc",
          pubKeyHash: 0x00,
          scriptHash: 0x05,
          validWitnessVersions: [0],
        },
        millisatoshis,
        tags: [
          { tagName: 'payment_hash', data: paymentHash },
          { tagName: 'description', data: description }
        ]
        }

        const prepared = bolt11.encode(bolt11Data, true)
        const signed = bolt11.sign(prepared, Buffer.from(MOCK_PRIVATE_KEY))
        const encoded = bolt11.encode(signed)
        const invoiceStr = encoded.paymentRequest

        const ourDecoded = decode(invoiceStr)

      expect(ourDecoded.success).toBe(true)
      if (ourDecoded.success) {
        expect(ourDecoded.data.millisatoshis).toBe(millisatoshis)
        expect(ourDecoded.data.payeeNodeKey).toBe(MOCK_PUB_KEY_HEX)

        const ph = ourDecoded.data.tags.find(
          (t) => t.tagName === "payment_hash"
        );
        const ds = ourDecoded.data.tags.find(
          (t) => t.tagName === "description"
        );
        expect(ph.data).toBe(paymentHash)
        expect(ds.data).toBe(description)
      }
    })

    it('should match decoding results from "bolt11" library for mock vectors', () => {
      MOCK_SUCCESS_DATA.slice(0, 5).forEach((vector) => {
        const result = decode(vector.invoice)
        const bolt11Result = bolt11.decode(vector.invoice)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data.millisatoshis).toBe(bolt11Result.millisatoshis || null)
          expect(result.data.timestamp).toBe(bolt11Result.timestamp)
          expect(result.data.payeeNodeKey).toBe(bolt11Result.payeeNodeKey)

          // Compare important tags
          if (bolt11Result.tagsObject.payment_hash) {
            const ourPh = result.data.tags.find(t => t.tagName === 'payment_hash')
            expect(ourPh.data).toBe(bolt11Result.tagsObject.payment_hash)
          }
          if (bolt11Result.tagsObject.description) {
            const ourDesc = result.data.tags.find(t => t.tagName === 'description')
            expect(ourDesc.data).toBe(bolt11Result.tagsObject.description)
          }
        }
      })
    })

    it('should be semantically identical to "bolt11" library after re-signing and re-encoding (Round-trip)', () => {
      MOCK_SUCCESS_DATA.forEach((vector) => {
        const originalBolt11 = bolt11.decode(vector.invoice)

        const decoded = decode(vector.invoice)
        expect(decoded.success).toBe(true)

        // STRIP original payee pubkey and signature
        // We must strip payee_node_key because it would conflict with our new signature
        const cleanTags = decoded.data.tags.filter(t => t.tagName !== 'payee_node_key')
        const cleanData = {
          ...decoded.data,
          tags: cleanTags,
          signature: undefined,
          recoveryFlag: undefined
        }

        const signed = sign(cleanData, MOCK_PRIVATE_KEY)
        expect(signed.success).toBe(true)

        const encoded = encode(signed.data)
        expect(encoded.success).toBe(true)

        const finalBolt11 = bolt11.decode(encoded.data)

        expect(finalBolt11.millisatoshis).toBe(originalBolt11.millisatoshis || null)
        expect(finalBolt11.payeeNodeKey).toBe(MOCK_PUB_KEY_HEX)
        expect(finalBolt11.tagsObject.payment_hash).toBe(originalBolt11.tagsObject.payment_hash)
        expect(finalBolt11.tagsObject.description).toBe(originalBolt11.tagsObject.description)

        if (originalBolt11.tagsObject.fallback_address) {
          expect(finalBolt11.tagsObject.fallback_address).toBeDefined()
          expect(finalBolt11.tagsObject.fallback_address.addressHash).toBe(originalBolt11.tagsObject.fallback_address.addressHash)
        }
        if (originalBolt11.tagsObject.routing_info) {
          expect(finalBolt11.tagsObject.routing_info).toBeDefined()
          expect(finalBolt11.tagsObject.routing_info.length).toBe(originalBolt11.tagsObject.routing_info.length)
        }
      })
    })
  })
})
