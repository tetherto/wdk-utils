import { bech32 } from '@scure/base'
import { stripLightningPrefix } from './utils.js'
import { sha256 } from '@noble/hashes/sha2'
import { secp256k1 } from '@noble/curves/secp256k1.js'

/**
 * @typedef {object} DecodedLightningInvoice
 * @property {string} [paymentRequest]
 * @property {boolean} [complete]
 * @property {string} [prefix]
 * @property {string} [wordsTemp]
 * @property {object} [network]
 * @property {string | null} [satoshis]
 * @property {string | null} [millisatoshis]
 * @property {number} [timestamp]
 * @property {string} [timestampString]
 * @property {number} [timeExpireDate]
 * @property {string} [timeExpireDateString]
 * @property {string} [payeeNodeKey]
 * @property {string} [signature]
 * @property {number} [recoveryFlag]
 * @property {Array<{tagName: string, data: string | number | object}>} tags
 */

const VALID_INVOICE_PREFIXES = ['lnbc', 'lntb', 'lnbcrt', 'lnsb']
const MULTIPLIER = {
  m: 1_000n,
  u: 1_000_000n,
  n: 1_000_000_000n,
  p: 1_000_000_000_000n
}
const MAX_MILLISATS = 21_000_000n * 10n ** 11n
const TAG_DEFS = [
  { char: 'p', code: 1, name: 'payment_hash', format: 'hex', length: 52 },
  { char: 's', code: 16, name: 'payment_secret', format: 'hex', length: 52 },
  { char: 'd', code: 13, name: 'description', format: 'string' },
  { char: 'n', code: 19, name: 'payee_node_key', format: 'hex', length: 53 },
  { char: 'h', code: 23, name: 'purpose_commit_hash', format: 'hex', length: 52 },
  { char: 'x', code: 6, name: 'expiry', format: 'number' },
  { char: 'c', code: 24, name: 'min_final_cltv_expiry', format: 'number' },
  { char: 'f', code: 9, name: 'fallback_address', format: 'raw' },
  { char: 'r', code: 3, name: 'routing_info', format: 'raw' },
  { char: '9', code: 5, name: 'feature_bits', format: 'raw' }
]
const TAG_BY_CODE = Object.fromEntries(TAG_DEFS.map((t) => [t.code, t]))

const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const FORMAT_PARSERS = {
  hex: (words) => bytesToHex(bech32.fromWords(words)),
  string: (words) => new TextDecoder().decode(bech32.fromWords(words)),
  number: (words) => Number(wordsToIntBE(words)),
  raw: (words) => words
}

/**
 * @typedef {{ success: true, type: 'invoice' }} LightningInvoiceValidationSuccess
 * @typedef {{ success: false, reason: string }} LightningInvoiceValidationFailure
 * @typedef {LightningInvoiceValidationSuccess | LightningInvoiceValidationFailure} LightningInvoiceValidationResult
 */

/**
 * Validates a Lightning Network invoice (lnbc, lntb, lnbcrt, lni; length >= 20).
 *
 * @param {string} address The invoice to validate.
 * @returns {LightningInvoiceValidationResult}
 */
export function validateLightningInvoice (address) {
  if (address == null || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const invoice = stripLightningPrefix(address)
  if (invoice.length === 0) {
    return { success: false, reason: 'EMPTY_ADDRESS' }
  }

  const lowerInvoice = invoice.toLowerCase()

  const hasValidPrefix = VALID_INVOICE_PREFIXES.some((prefix) =>
    lowerInvoice.startsWith(prefix)
  )
  if (!hasValidPrefix) {
    return { success: false, reason: 'INVALID_PREFIX' }
  }
  if (invoice.length < 20) {
    return { success: false, reason: 'INVALID_LENGTH' }
  }
  try {
    bech32.decode(invoice, false)
    return { success: true, type: 'invoice' }
  } catch (e) {
    if (e && e.message && e.message.toLowerCase().includes('lowercase or uppercase')) {
      return { success: false, reason: 'MIXED_CASE' }
    }

    return { success: false, reason: 'INVALID_BECH32_FORMAT' }
  }
}

function convertBits(data, from, to, pad) {
  let acc = 0
  let bits = 0
  const res = new Uint8Array(Math.ceil((data.length * from) / to))
  let i = 0
  for (const value of data) {
    acc = (acc << from) | value
    bits += from
    while (bits >= to) {
      bits -= to
      res[i++] = (acc >> bits) & ((1 << to) - 1)
    }
  }
  if (pad && bits > 0) {
    res[i++] = (acc << (to - bits)) & ((1 << to) - 1)
  }
  return res.slice(0, i)
}

function parseHrp (hrp) {
  let network, amountPart

  if (hrp.startsWith('lnbcrt')) {
    network = 'regtest'
    amountPart = hrp.slice(6)
  } else if (hrp.startsWith('lntb')) {
    network = 'testnet'
    amountPart = hrp.slice(4)
  } else if (hrp.startsWith('lnbc')) {
    network = 'bitcoin'
    amountPart = hrp.slice(4)
  } else if (hrp.startsWith('lnsb')) {
    network = 'signet'
    amountPart = hrp.slice(4)
  } else {
    throw new Error('Invalid HRP')
  }

  if (!amountPart) return { network, satoshis: null, millisatoshis: null }

  const match = amountPart.match(/^(\d+)([munp]?)$/)
  if (!match) throw new Error('Invalid amount in HRP')

  const value = BigInt(match[1])
  const multiplier = match[2]

  if (multiplier === 'p' && value % 10n !== 0n) throw new Error('Amount too small')

  const millisatoshis = multiplier
    ? (value * 10n ** 11n) / MULTIPLIER[multiplier]
    : value * 10n ** 11n

  if (millisatoshis > MAX_MILLISATS) throw new Error('Amount too large')

  return {
    network,
    satoshis: (millisatoshis / 1000n).toString(),
    millisatoshis: millisatoshis.toString()
  }
}

/**
 * @typedef {{ success: true, type: 'invoice', data: DecodedLightningInvoice }} LightningInvoiceDecodingSuccess
 * @typedef {{ success: false, reason: string }} LightningInvoiceDecodingFailure
 * @typedef {LightningInvoiceDecodingSuccess | LightningInvoiceDecodingFailure} LightningInvoiceDecodingResult
 */

/**
 * Decodes a BOLT11 Lightning Network invoice.
 *
 * NOTE: Payment descriptions are user-defined and can contain injection attacks.
 * Always sanitize descriptions before rendering in HTML or persisting in databases.
 *
 * @param {string} invoice - The BOLT11 invoice string to decode.
 * @returns {LightningInvoiceDecodingResult}
 */
export function decode (invoice) {
  const invoiceString = stripLightningPrefix(invoice)
  if (invoiceString.length === 0) {
    return { success: false, reason: 'EMPTY_INVOICE' }
  }

  try {
    const { prefix, words } = bech32.decode(invoiceString, false)
    const hrpData = parseHrp(prefix)
    const bodyWords = words.slice(0, -104)

    if (bodyWords.length < 7) {
      return { success: false, reason: 'INVOICE_TOO_SHORT' }
    }

    const timestamp = Number(wordsToIntBE(bodyWords.slice(0, 7)))
  
    const tags = []
    const tagWords = bodyWords.slice(7)
    let index = 0
    while (index < tagWords.length) {
      if (index + 3 > tagWords.length) return { success: false, reason: 'TRUNCATED_TAG_HEADER' }

      const tagCode = tagWords[index]
      const length = (tagWords[index + 1] << 5) | tagWords[index + 2]
      if (index + 3 + length > tagWords.length) return { success: false, reason: 'TRUNCATED_TAG_DATA' }

      const data = tagWords.slice(index + 3, index + 3 + length)
      const tagDef = TAG_BY_CODE[tagCode]

      if (tagDef) {
        if (tagDef.length && length !== tagDef.length) return { success: false, reason: 'INVALID_TAG_LENGTH' }
        const parser = FORMAT_PARSERS[tagDef.format] || FORMAT_PARSERS.raw
    
        tags.push({
          tagName: tagDef.name,
          data: parser(data)
        })
      }
  
      index += 3 + length
    }
  
    const hasDescription = tags.some(t => t.tagName === 'description')
    const hasPurposeCommitHash = tags.some(t => t.tagName === 'purpose_commit_hash')
  
    if (!hasDescription && !hasPurposeCommitHash) return { success: false, reason: 'MISSING_DESCRIPTION' }
    if (hasDescription && hasPurposeCommitHash) return { success: false, reason: 'MUTUALLY_EXCLUSIVE_TAGS' }
    if (!tags.some(t => t.tagName === 'payment_hash')) return { success: false, reason: 'MISSING_PAYMENT_HASH' }
  
    const uniqueTags = ['payment_hash', 'payment_secret', 'expiry', 'payee_node_key']
    for (const name of uniqueTags) {
      if (tags.filter(({ tagName }) => name === tagName).length > 1) {
        return { success: false, reason: 'DUPLICATE_TAG' }
      }
    }
  
    const sigWords = words.slice(-104)
    const sigBytes = bech32.fromWords(sigWords)
    const signatureBytes = sigBytes.slice(0, 64)
    const recoveryFlag = sigBytes[64]

    const hrpBytes = new TextEncoder().encode(prefix)
    const bodyBytes = convertBits(bodyWords, 5, 8, true)
    const toSign = new Uint8Array(hrpBytes.length + bodyBytes.length)
    toSign.set(hrpBytes)
    toSign.set(bodyBytes, hrpBytes.length)

    const msgHash = sha256(toSign)
    const recoveredPubKey = secp256k1.Signature.fromBytes(signatureBytes)
      .addRecoveryBit(recoveryFlag)
      .recoverPublicKey(msgHash)
      .toHex(true)

    const payeeNodeKeyTag = tags.find(t => t.tagName === 'payee_node_key')
    if (payeeNodeKeyTag && payeeNodeKeyTag.data !== recoveredPubKey) {
      return { success: false, reason: 'SIGNATURE_PUBKEY_MISMATCH' }
    }

    const expiryTag = tags.find(t => t.tagName === 'expiry')
    const expiry = expiryTag ? expiryTag.data : 3600
    const timeExpireDate = timestamp + expiry

    /** @type {DecodedLightningInvoice} */
    const data = {
      paymentRequest: invoiceString,
      complete: true,
      prefix,
      network: hrpData.network,
      satoshis: hrpData.satoshis,
      millisatoshis: hrpData.millisatoshis,
      timestamp,
      timestampString: new Date(timestamp * 1000).toISOString(),
      timeExpireDate,
      timeExpireDateString: new Date(timeExpireDate * 1000).toISOString(),
      payeeNodeKey: recoveredPubKey,
      signature: bytesToHex(signatureBytes),
      recoveryFlag,
      tags
    }
  
    return { success: true, type: 'invoice', data }
  } catch (e) {
    return { success: false, reason: 'DECODING_FAILED' }
  }
}


function wordsToIntBE (words) {
  let result = 0n
  for (const word of words) {
    result = (result << 5n) | BigInt(word)
  }

  return result
}