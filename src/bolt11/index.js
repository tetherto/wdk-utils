// Copyright 2026 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import { bech32, bech32m, createBase58check } from '@scure/base'
import { stripLightningPrefix } from '../address-validation/utils.js'
import { sha256 } from '@noble/hashes/sha2'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { validateBitcoinAddress } from '../address-validation/bitcoin.js'

/** @typedef {string | number | Uint8Array} TagData */

/**
* @typedef {object} Tag
* @property {string} tagName - BOLT11 tag name (e.g. 'payment_hash', 'description')
* @property {TagData} data - Decoded tag value
*/

/**
* @typedef {object} DecodedLightningInvoice
* @property {'bitcoin' | 'regtest' | 'testnet' | 'signet'} network - Bitcoin network the invoice is for
* @property {string | null} [millisatoshis] - Invoice amount in millisatoshis
* @property {number} [timestamp] - Invoice creation time (Unix seconds)
* @property {number} [timeExpireDate] - Invoice expiry time (Unix seconds)
* @property {string} [payeeNodeKey] - Payee node public key (hex)
* @property {string} [signature] - Invoice signature (hex)
* @property {number} [recoveryFlag] - Signature recovery flag
* @property {Tag[]} tags - List of tagged fields
* @property {string} [paymentRequest] - Original encoded payment request string
*/

/**
* @typedef {{ success: true, type: 'invoice' }} LightningInvoiceValidationSuccess
* @typedef {{ success: false, reason: string }} LightningInvoiceValidationFailure
* @typedef {LightningInvoiceValidationSuccess | LightningInvoiceValidationFailure} LightningInvoiceValidationResult
*/

/**
* @typedef {{ success: true, type: 'invoice', data: DecodedLightningInvoice }} LightningInvoiceDecodingSuccess
* @typedef {{ success: false, reason: string }} LightningInvoiceDecodingFailure
* @typedef {LightningInvoiceDecodingSuccess | LightningInvoiceDecodingFailure} LightningInvoiceDecodingResult
*/

/**
* @typedef {{ success: true, type: 'hash', data: Uint8Array }} LightningInvoiceHashingSuccess
* @typedef {{ success: false, reason: string }} LightningInvoiceHashingFailure
* @typedef {LightningInvoiceHashingSuccess | LightningInvoiceHashingFailure} LightningInvoiceHashingResult
*/

/**
* @typedef {{ success: true, type: 'invoice', data: DecodedLightningInvoice }} LightningInvoiceSigningSuccess
* @typedef {{ success: false, reason: string }} LightningInvoiceSigningFailure
* @typedef {LightningInvoiceSigningSuccess | LightningInvoiceSigningFailure} LightningInvoiceSigningResult
*/

/**
* @typedef {{ success: true, type: 'invoice', data: string }} LightningInvoiceEncodingSuccess
* @typedef {{ success: false, reason: string }} LightningInvoiceEncodingFailure
* @typedef {LightningInvoiceEncodingSuccess | LightningInvoiceEncodingFailure} LightningInvoiceEncodingResult
*/

const base58check = createBase58check(sha256)
const VALID_PREFIXES = [
  { network: 'regtest', prefix: 'lnbcrt', bech32: 'bcrt', p2pkh: 0x6f, p2sh: 0xc4 },
  { network: 'bitcoin', prefix: 'lnbc', bech32: 'bc', p2pkh: 0x00, p2sh: 0x05 },
  { network: 'testnet', prefix: 'lntb', bech32: 'tb', p2pkh: 0x6f, p2sh: 0xc4 },
  { network: 'signet', prefix: 'lnsb', bech32: 'tb', p2pkh: 0x6f, p2sh: 0xc4 }
]
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
  { char: 'f', code: 9, name: 'fallback_address', format: 'fallback_address' },
  { char: 'r', code: 3, name: 'routing_info', format: 'routing_info' },
  { char: '9', code: 5, name: 'feature_bits', format: 'feature_bits' }
]
const TAG_BY_CODE = Object.fromEntries(TAG_DEFS.map((t) => [t.code, t]))

const bytesToHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

const hexToBytes = (hex) => {
  if (hex.length % 2 !== 0) throw new Error('INVALID_HEX_STRING')
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

const FORMAT_DECODERS = {
  hex: (words) => bytesToHex(bech32.fromWords(words)),
  string: (words) => new TextDecoder().decode(bech32.fromWords(words)),
  number: (words) => Number(wordsToIntBE(words)),
  feature_bits: (words) => words,
  fallback_address: (words, networkInfo) => {
    if (words.length < 1) throw new Error('INVALID_FALLBACK_ADDRESS_DATA')
    const version = words[0]
    const hash = bech32.fromWords(words.slice(1))
    const addressHash = bytesToHex(hash)

    let address = null
    if (networkInfo) {
      if (version === 17) {
        const payload = new Uint8Array(21)
        payload[0] = networkInfo.p2pkh
        payload.set(hash, 1)
        address = base58check.encode(payload)
      } else if (version === 18) {
        const payload = new Uint8Array(21)
        payload[0] = networkInfo.p2sh
        payload.set(hash, 1)
        address = base58check.encode(payload)
      } else if (version <= 16) {
        const encoder = version === 0 ? bech32 : bech32m
        address = encoder.encode(networkInfo.bech32, [version, ...bech32.toWords(hash)])
      }
    }

    return { version, addressHash, address, code: version }
  },
  routing_info: (words) => {
    const routes = []
    const bytes = bech32.fromWords(words)
    if (bytes.length % 51 !== 0) throw new Error('INVALID_ROUTING_INFO_LENGTH')
    for (let i = 0; i < bytes.length; i += 51) {
      routes.push({
        pubkey: bytesToHex(bytes.slice(i, i + 33)),
        short_channel_id: bytesToHex(bytes.slice(i + 33, i + 41)),
        fee_base_msat: Number(BigInt('0x' + bytesToHex(bytes.slice(i + 41, i + 45)))),
        fee_proportional_millionths: Number(BigInt('0x' + bytesToHex(bytes.slice(i + 45, i + 49)))),
        cltv_expiry_delta: (bytes[i + 49] << 8) | bytes[i + 50]
      })
    }
    return routes
  },
  raw: (words) => words
}

const FORMAT_ENCODERS = {
  hex: (data) => bech32.toWords(hexToBytes(data)),
  string: (data) => bech32.toWords(new TextEncoder().encode(data)),
  number: (data) => {
    const val = BigInt(data)
    if (val === 0n) return new Uint8Array([0])
    let len = 0
    for (let v = val; v > 0n; v >>= 5n) len++
    return intBEToWords(val, len)
  },
  feature_bits: (data) => {
    if (!Array.isArray(data)) throw new Error('INVALID_FEATURE_BITS_FORMAT')
    if (data.some(w => typeof w !== 'number' || w < 0 || w > 31)) throw new Error('INVALID_FEATURE_BITS_DATA')
    return new Uint8Array(data)
  },
  fallback_address: (data, networkInfo) => {
    let version, addressHash

    if (typeof data === 'string') {
      const validation = validateBitcoinAddress(data)
      if (!validation.success) throw new Error('INVALID_FALLBACK_ADDRESS')

      if (networkInfo) {
        const isBtcMainnet = networkInfo.network === 'bitcoin' && validation.network === 'mainnet'
        const isBtcTestnet = networkInfo.network === 'testnet' && (validation.network === 'testnet' || validation.network === 'signet')
        const isBtcRegtest = networkInfo.network === 'regtest' && validation.network === 'regtest'

        if (!isBtcMainnet && !isBtcTestnet && !isBtcRegtest) {
          throw new Error('FALLBACK_ADDRESS_NETWORK_MISMATCH')
        }
      }

      if (validation.type === 'p2pkh') version = 17
      else if (validation.type === 'p2sh') version = 18
      else if (validation.type === 'bech32' || validation.type === 'bech32m') {
        const decoded = (validation.type === 'bech32' ? bech32 : bech32m).decode(data)
        version = decoded.words[0]
      } else {
        throw new Error('UNSUPPORTED_ADDRESS_TYPE')
      }

      if (validation.type === 'p2pkh' || validation.type === 'p2sh') {
        const decoded = base58check.decode(data)
        addressHash = bytesToHex(decoded.slice(1))
      } else {
        const b = (validation.type === 'bech32' ? bech32 : bech32m)
        const decoded = b.decode(data)
        addressHash = bytesToHex(b.fromWords(decoded.words.slice(1)))
      }
    } else if (data && typeof data === 'object') {
      version = data.version !== undefined ? data.version : data.code
      addressHash = data.addressHash
    } else {
      throw new Error('INVALID_FALLBACK_ADDRESS_FORMAT')
    }

    if (typeof version !== 'number' || version < 0 || version > 31) throw new Error('INVALID_FALLBACK_ADDRESS_VERSION')
    if (typeof addressHash !== 'string') throw new Error('INVALID_FALLBACK_ADDRESS_HASH_TYPE')

    const hashBytes = hexToBytes(addressHash)
    const hashWords = bech32.toWords(hashBytes)
    const result = new Uint8Array(1 + hashWords.length)
    result[0] = version
    result.set(hashWords, 1)
    return result
  },
  routing_info: (data) => {
    if (!Array.isArray(data)) throw new Error('INVALID_ROUTING_INFO_FORMAT')
    const bytes = new Uint8Array(data.length * 51)
    data.forEach((route, i) => {
      if (!route.pubkey || !route.short_channel_id || route.fee_base_msat === undefined ||
          route.fee_proportional_millionths === undefined || route.cltv_expiry_delta === undefined) {
        throw new Error('MISSING_ROUTING_INFO_FIELDS')
      }
      const pubkeyBytes = hexToBytes(route.pubkey)
      if (pubkeyBytes.length !== 33) throw new Error('INVALID_ROUTING_INFO_PUBKEY_LENGTH')
      const scidBytes = hexToBytes(route.short_channel_id)
      if (scidBytes.length !== 8) throw new Error('INVALID_ROUTING_INFO_SCID_LENGTH')

      bytes.set(pubkeyBytes, i * 51)
      bytes.set(scidBytes, i * 51 + 33)

      const baseFee = new Uint8Array(4)
      new DataView(baseFee.buffer).setUint32(0, Number(route.fee_base_msat))
      bytes.set(baseFee, i * 51 + 41)

      const propFee = new Uint8Array(4)
      new DataView(propFee.buffer).setUint32(0, Number(route.fee_proportional_millionths))
      bytes.set(propFee, i * 51 + 45)

      bytes[i * 51 + 49] = Number(route.cltv_expiry_delta) >> 8
      bytes[i * 51 + 50] = Number(route.cltv_expiry_delta) & 0xff
    })
    return bech32.toWords(bytes)
  },
  raw: (data) => { throw new Error('UNSUPPORTED_TAG_DATA_TYPE') }
}

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

  const hasValidPrefix = VALID_PREFIXES
    .map(prefixObj => prefixObj.prefix)
    .some((prefix) => lowerInvoice.startsWith(prefix))
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

function convertBits (data, from, to, pad) {
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

  for (const prefixObj of VALID_PREFIXES) {
    if (hrp.startsWith(prefixObj.prefix)) {
      network = prefixObj.network
      amountPart = hrp.slice(prefixObj.prefix.length)
      break
    }
  }

  if (!network) {
    throw new Error('INVALID_HRP')
  }

  if (!amountPart) return { network, satoshis: null, millisatoshis: null }

  const match = amountPart.match(/^(\d+)([munp]?)$/)
  if (!match) throw new Error('Invalid amount in HRP')

  const value = BigInt(match[1])
  const multiplier = match[2]

  if (multiplier === 'p' && value % 10n !== 0n) throw new Error('AMOUNT_TOO_SMALL')

  const millisatoshis = multiplier
    ? (value * 10n ** 11n) / MULTIPLIER[multiplier]
    : value * 10n ** 11n

  if (millisatoshis > MAX_MILLISATS) throw new Error('AMOUNT_TOO_LARGE')

  return {
    network,
    satoshis: (millisatoshis / 1000n).toString(),
    millisatoshis: millisatoshis.toString()
  }
}

/**
 * Decodes a BOLT11 Lightning Network invoice.
 *
 * Payment descriptions are user-defined and can contain injection attacks.
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
    const networkInfo = VALID_PREFIXES.find(p => p.network === hrpData.network)
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
        const parser = FORMAT_DECODERS[tagDef.format] || FORMAT_DECODERS.raw

        tags.push({
          tagName: tagDef.name,
          data: parser(data, networkInfo)
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
      network: hrpData.network,
      millisatoshis: hrpData.millisatoshis,
      timestamp,
      timeExpireDate,
      payeeNodeKey: recoveredPubKey,
      signature: bytesToHex(signatureBytes),
      recoveryFlag,
      tags,
      paymentRequest: invoiceString
    }

    return { success: true, type: 'invoice', data }
  } catch (e) {
    return { success: false, reason: e.message ?? 'DECODING_FAILED' }
  }
}

function wordsToIntBE (words) {
  let result = 0n
  for (const word of words) {
    result = (result << 5n) | BigInt(word)
  }

  return result
}

/**
 * Converts a BigInt into an array of 5-bit words (big-endian).
 * @param {bigint} value
 * @param {number} wordCount - Number of words to return (padded with leading zeros).
 * @returns {Uint8Array}
 */
function intBEToWords (value, wordCount) {
  const words = new Uint8Array(wordCount)
  for (let i = wordCount - 1; i >= 0; i--) {
    words[i] = Number(value & 0x1fn)
    value >>= 5n
  }
  return words
}

/**
 * Encode the HRP with network and amount
 * @param {'bitcoin' | 'testnet' | 'regtest' | 'signet'} network
 * @param {string | number | bigint} [millisatoshis]
 * @returns {string}
 */
function encodeHrp (network, millisatoshis) {
  const prefixObj = VALID_PREFIXES.find(p => p.network === network)
  if (!prefixObj) throw new Error('Invalid network')
  const prefix = prefixObj.prefix

  if (!millisatoshis) return prefix

  const msats = BigInt(millisatoshis)
  if (msats <= 0n) return prefix

  const BTC_MSATS = 10n ** 11n

  if (msats % BTC_MSATS === 0n) return prefix + (msats / BTC_MSATS).toString()

  for (const [key, value] of Object.entries(MULTIPLIER)) {
    if (key === 'p') continue

    const unit = BTC_MSATS / value
    if (msats % unit === 0n) {
      return prefix + (msats / unit).toString() + key
    }
  }

  // 1 pBTC = 0.1 millisatoshis
  return prefix + (msats * 10n).toString() + 'p'
}

function encodeTag (tagName, data, networkInfo) {
  try {
    const tagDef = TAG_DEFS.find(t => t.name === tagName)
    if (!tagDef) throw new Error('UNKNOWN_TAG')

    const encoder = FORMAT_ENCODERS[tagDef.format] || FORMAT_ENCODERS.raw
    const words = encoder(data, networkInfo)

    if (tagDef.length && words.length !== tagDef.length) {
      throw new Error('INVALID_TAG_LENGTH')
    }

    if (words.length >= 1024) {
      throw new Error('TAG_DATA_TOO_LONG')
    }

    const tagWords = new Uint8Array(3 + words.length)
    tagWords[0] = tagDef.code
    tagWords[1] = words.length >> 5
    tagWords[2] = words.length & 0x1f
    tagWords.set(words, 3)

    return tagWords
  } catch (e) {
    throw new Error(`ENCODE_TAG_FAILED: ${tagName} (${e?.message})`)
  }
}

/**
 * Validates the structure and mandatory fields of a BOLT11 invoice object.
 * @param {DecodedLightningInvoice} invoiceData
 * @throws {Error} If validation fails
 */
function validateInvoiceData (invoiceData) {
  if (!invoiceData.network) throw new Error('NETWORK_REQUIRED')
  if (!VALID_PREFIXES.some(p => p.network === invoiceData.network)) throw new Error('INVALID_NETWORK')

  const tags = invoiceData.tags || []
  const tagNames = tags.map(t => t.tagName)

  if (!tagNames.includes('payment_hash')) throw new Error('MISSING_PAYMENT_HASH')

  const hasDescription = tagNames.includes('description')
  const hasDescriptionHash = tagNames.includes('purpose_commit_hash')

  if (!hasDescription && !hasDescriptionHash) throw new Error('MISSING_DESCRIPTION')
  if (hasDescription && hasDescriptionHash) throw new Error('MUTUALLY_EXCLUSIVE_TAGS')

  const uniqueTags = ['payment_hash', 'payment_secret', 'expiry', 'payee_node_key']
  for (const name of uniqueTags) {
    if (tags.filter(t => t.tagName === name).length > 1) throw new Error('DUPLICATE_TAG')
  }

  if (invoiceData.millisatoshis) {
    const msats = BigInt(invoiceData.millisatoshis)
    if (msats <= 0n) throw new Error('INVALID_AMOUNT')
    if (msats > MAX_MILLISATS) throw new Error('AMOUNT_TOO_LARGE')
  }

  const timestamp = BigInt(invoiceData.timestamp || Math.floor(Date.now() / 1000))
  if (timestamp >= 2n ** 35n) throw new Error('TIMESTAMP_TOO_LARGE')
}

function prepareWords (invoiceData) {
  validateInvoiceData(invoiceData)

  const networkInfo = VALID_PREFIXES.find(p => p.network === invoiceData.network)
  const hrp = encodeHrp(invoiceData.network, invoiceData.millisatoshis)
  const timestamp = BigInt(invoiceData.timestamp || Math.floor(Date.now() / 1000))
  const timestampWords = intBEToWords(timestamp, 7)

  const tags = [...(invoiceData.tags || [])]

  if (invoiceData.timeExpireDate && !tags.some(t => t.tagName === 'expiry')) {
    const expiry = Math.max(0, Math.floor(invoiceData.timeExpireDate - Number(timestamp)))
    tags.push({ tagName: 'expiry', data: expiry })
  }

  const tagsWords = []
  for (const tag of tags) {
    tagsWords.push(...encodeTag(tag.tagName, tag.data, networkInfo))
  }

  const bodyWords = new Uint8Array(timestampWords.length + tagsWords.length)
  bodyWords.set(timestampWords)
  bodyWords.set(new Uint8Array(tagsWords), timestampWords.length)

  return { hrp, bodyWords }
}

/**
 * Returns the SHA-256 hash that needs to be signed for an invoice.
 * @param {DecodedLightningInvoice} invoiceData
 * @returns {LightningInvoiceHashingResult}
 */
export function getHashToSign (invoiceData) {
  try {
    const { hrp, bodyWords } = prepareWords(invoiceData)

    const hrpBytes = new TextEncoder().encode(hrp)
    const bodyBytes = convertBits(bodyWords, 5, 8, true)
    const toSign = new Uint8Array(hrpBytes.length + bodyBytes.length)
    toSign.set(hrpBytes)
    toSign.set(bodyBytes, hrpBytes.length)

    return { success: true, type: 'hash', data: sha256(toSign) }
  } catch (e) {
    return { success: false, reason: e.message }
  }
}

/**
 * Signs a BOLT11 invoice.
 * @param {DecodedLightningInvoice} invoiceData
 * @param {string | Uint8Array} privateKey - Hex-encoded string or Uint8Array
 * @returns {LightningInvoiceSigningResult} The signed invoice data
 */
export function sign (invoiceData, privateKey) {
  let privKeyBytes
  try {
    const hashResult = getHashToSign(invoiceData)
    if (!hashResult.success) return hashResult

    privKeyBytes = typeof privateKey === 'string'
      ? hexToBytes(privateKey)
      : new Uint8Array(privateKey)

    const sigBytes = secp256k1.sign(hashResult.data, privKeyBytes, { format: 'recovered', prehash: false })

    return {
      success: true,
      type: 'invoice',
      data: {
        ...invoiceData,
        signature: bytesToHex(sigBytes.subarray(1)),
        recoveryFlag: sigBytes[0]
      }
    }
  } catch (e) {
    return { success: false, reason: 'SIGNING_FAILED' }
  } finally {
    if (privKeyBytes) {
      privKeyBytes.fill(0)
    }
  }
}

/**
 * Encodes a BOLT11 invoice.
 * @param {DecodedLightningInvoice} invoiceData
 * @returns {LightningInvoiceEncodingResult}
 */
export function encode (invoiceData) {
  try {
    if (!invoiceData.signature || invoiceData.recoveryFlag === undefined) {
      return { success: false, reason: 'MISSING_SIGNATURE' }
    }

    const { hrp, bodyWords } = prepareWords(invoiceData)

    const sigBytes = new Uint8Array(65)
    sigBytes.set(hexToBytes(invoiceData.signature))
    sigBytes[64] = invoiceData.recoveryFlag

    const sigWords = bech32.toWords(sigBytes)

    const finalWords = new Uint8Array(bodyWords.length + sigWords.length)
    finalWords.set(bodyWords)
    finalWords.set(sigWords, bodyWords.length)

    return { success: true, type: 'invoice', data: bech32.encode(hrp, finalWords, false) }
  } catch (e) {
    return { success: false, reason: e.message ?? 'ENCODING_FAILED' }
  }
}
