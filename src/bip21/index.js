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

/**
 * @typedef {{
 *   address: string
 *   amount?: string
 *   label?: string
 *   message?: string
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

const BIP21_SCHEME_REGEX = /^bitcoin:/i

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
      key = decodeURIComponent(rawKey.replace(/\+/g, '%20'))
      value = decodeURIComponent(rawValue.replace(/\+/g, '%20'))
    } catch {
      continue
    }

    params[key] = value
  }

  return params
}

/**
 * Returns true if the input looks like a BIP-21 Bitcoin payment URI.
 * This is syntactic detection only (not a full validity check).
 *
 * @param {string} input
 * @returns {boolean}
 */
export function isBip21Request (input) {
  if (typeof input !== 'string') return false
  const trimmed = input.trim()
  if (!trimmed) return false
  if (!BIP21_SCHEME_REGEX.test(trimmed)) return false
  const afterScheme = trimmed.slice('bitcoin:'.length)
  return afterScheme.trim().length > 0
}

/**
 * Parses a BIP-21 Bitcoin payment URI.
 *
 * Supports:
 *   bitcoin:<address>[?amount=<btc>][&label=<label>][&message=<message>]
 *
 * @param {string} input
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

  const withoutScheme = trimmed.slice('bitcoin:'.length)
  const queryStart = withoutScheme.indexOf('?')
  const addressRaw = queryStart === -1 ? withoutScheme : withoutScheme.slice(0, queryStart)
  const queryString = queryStart === -1 ? '' : withoutScheme.slice(queryStart + 1)

  if (!addressRaw || !addressRaw.trim()) {
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
    if (!/^(0|[1-9]\d*)(\.\d+)?$/.test(params.amount)) {
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
