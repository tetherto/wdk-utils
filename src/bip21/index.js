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

import { validateBitcoinAddress } from '../address-validation/bitcoin.js'

const BIP21_SCHEME_REGEX = /^bitcoin:/i
const AMOUNT_REGEX = /^(0|[1-9]\d*)(\.\d{1,8})?$/
const MAX_BTC = 21_000_000

/**
 * @typedef {{
 *   address: string - Validated Bitcoin address
 *   amount?: string - Decimal BTC amount, up to 8 decimal places (e.g. '0.001')
 *   label?: string - URL-decoded label
 *   message?: string - URL-decoded message
 * }} Bip21Request
 */

/**
 * @typedef {{
 *   success: true
 *   type: 'bip21'
 *   value: Bip21Request
 * }} Bip21ParseSuccess
 */

/**
 * @typedef {{
 *   success: false
 *   reason:
 *     | 'INVALID_FORMAT'
 *     | 'INVALID_ADDRESS'
 *     | 'INVALID_AMOUNT'
 *     | 'UNSUPPORTED_REQUIRED_PARAM'
 * }} Bip21ParseFailure
 */

/**
 * @typedef {Bip21ParseSuccess | Bip21ParseFailure} Bip21ParseResult
 */

/**
 * Parses a BIP-21 query string into a key/value map.
 * Keys and values are percent-decoded. The `+` character is treated as a literal `+`
 * (BIP-21 is not application/x-www-form-urlencoded).
 *
 * @param {string} query - Raw query string (without the leading `?`)
 * @returns {Record<string, string>}
 */
function parseQueryParams (query) {
  const params = {}
  if (!query) return params

  const segments = query.split('&')
  for (const segment of segments) {
    if (!segment) continue
    const eqIndex = segment.indexOf('=')
    const rawKey = eqIndex === -1 ? segment : segment.slice(0, eqIndex)
    const rawValue = eqIndex === -1 ? '' : segment.slice(eqIndex + 1)

    let key, value
    try {
      key = decodeURIComponent(rawKey)
      value = decodeURIComponent(rawValue)
    } catch {
      continue
    }

    params[key] = value
  }

  return params
}

/**
 * Returns true if the input looks like a BIP-21 Bitcoin payment URI.
 * This is a syntactic check only — it does not validate the address or parameters.
 *
 * @param {string} input - The string to test.
 * @returns {boolean}
 */
export function isBip21Request (input) {
  if (typeof input !== 'string') return false
  const trimmed = input.trim()
  if (!trimmed) return false
  if (!BIP21_SCHEME_REGEX.test(trimmed)) return false
  const afterScheme = trimmed.replace(BIP21_SCHEME_REGEX, '')
  const addressPart = afterScheme.split('?')[0]
  return addressPart.trim().length > 0
}

/**
 * Parses a BIP-21 Bitcoin payment URI.
 *
 * Supports:
 *   bitcoin:<address>[?amount=<btc>][&label=<label>][&message=<message>]
 *
 * @param {string} input - The BIP-21 URI string to parse.
 * @returns {Bip21ParseResult}
 */
export function parseBip21Request (input) {
  if (typeof input !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const trimmed = input.trim()
  if (!isBip21Request(trimmed)) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const withoutScheme = trimmed.replace(BIP21_SCHEME_REGEX, '')
  const queryStart = withoutScheme.indexOf('?')
  const addressRaw = (queryStart === -1 ? withoutScheme : withoutScheme.slice(0, queryStart)).trim()
  const queryString = queryStart === -1 ? '' : withoutScheme.slice(queryStart + 1)

  if (!addressRaw) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const addressValidation = validateBitcoinAddress(addressRaw)
  if (!addressValidation.success) {
    return { success: false, reason: 'INVALID_ADDRESS' }
  }

  const params = parseQueryParams(queryString)

  const requiredParam = Object.keys(params).find(k => k.startsWith('req-'))
  if (requiredParam) {
    return { success: false, reason: 'UNSUPPORTED_REQUIRED_PARAM' }
  }

  if (params.amount !== undefined) {
    if (!AMOUNT_REGEX.test(params.amount)) {
      return { success: false, reason: 'INVALID_AMOUNT' }
    }
    if (parseFloat(params.amount) > MAX_BTC) {
      return { success: false, reason: 'INVALID_AMOUNT' }
    }
  }

  /** @type {Bip21Request} */
  const value = { address: addressRaw }
  if (params.amount !== undefined) value.amount = params.amount
  if (params.label !== undefined) value.label = params.label
  if (params.message !== undefined) value.message = params.message

  return { success: true, type: 'bip21', value }
}

/**
 * Encodes a BIP-21 Bitcoin payment URI from a request object.
 *
 * @param {Bip21Request} request - The payment request object to encode.
 * @returns {string}
 */
export function encodeBip21Request (request) {
  if (!request || typeof request !== 'object') throw new Error('INVALID_REQUEST')

  const addressValidation = validateBitcoinAddress(request.address)
  if (!addressValidation.success) throw new Error('INVALID_ADDRESS')

  if (request.amount !== undefined) {
    if (!AMOUNT_REGEX.test(request.amount)) throw new Error('INVALID_AMOUNT')
    if (parseFloat(request.amount) > MAX_BTC) throw new Error('INVALID_AMOUNT')
  }

  const parts = []
  if (request.amount !== undefined) parts.push(`amount=${encodeURIComponent(request.amount)}`)
  if (request.label !== undefined) parts.push(`label=${encodeURIComponent(request.label)}`)
  if (request.message !== undefined) parts.push(`message=${encodeURIComponent(request.message)}`)
  const query = parts.length > 0 ? `?${parts.join('&')}` : ''
  return `bitcoin:${request.address}${query}`
}
