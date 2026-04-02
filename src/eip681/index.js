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

import { validateEVMAddress } from '../address-validation/evm.js'

const SUPPORTED_SCHEMES = [
  'ethereum',
  'pol',
  'matic',
  'polygon',
  'arbitrum',
  'plasma'
]

const EIP681_PREFIX_REGEX = /^[a-z][a-z0-9+.-]*:/i

/**
 * @typedef {{
 *   recipient: string
 *   tokenAddress: string
 *   chainId: number
 *   amountSmallest: string
 * }} Eip681TransferRequest
 */

/**
 * @typedef {{
 *   success: true
 *   type: 'eip681-transfer'
 *   value: Eip681TransferRequest
 * }} Eip681ParseSuccess
 */

/**
 * @typedef {{
 *   success: false
 *   reason:
 *     | 'INVALID_FORMAT'
 *     | 'UNSUPPORTED_METHOD'
 *     | 'MISSING_REQUIRED_PARAM'
 *     | 'INVALID_RECIPIENT'
 *     | 'INVALID_AMOUNT'
 * }} Eip681ParseFailure
 */

/**
 * @typedef {Eip681ParseSuccess | Eip681ParseFailure} Eip681ParseResult
 */

function normalizeTokenAddress (value) {
  const tokenAddress = value.startsWith('0x') ? value : `0x${value}`
  if (!/^0x[0-9a-fA-F]{40}$/.test(tokenAddress)) {
    return null
  }
  return tokenAddress
}

function scientificToIntegerString (value) {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (!/^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(trimmed)) {
    return null
  }

  const [mantissaRaw, exponentRaw] = trimmed.toLowerCase().split('e')
  const exponent = exponentRaw ? Number.parseInt(exponentRaw, 10) : 0
  if (!Number.isFinite(exponent)) return null

  const [whole = '', fraction = ''] = mantissaRaw.split('.')
  const digits = `${whole}${fraction}`.replace(/^0+/, '') || '0'
  const shift = exponent - fraction.length

  if (shift >= 0) {
    return `${digits}${'0'.repeat(shift)}`.replace(/^0+/, '') || '0'
  }

  const decimalIndex = digits.length + shift
  if (decimalIndex <= 0) {
    return /^0+$/.test(digits) ? '0' : null
  }

  const integerPart = digits.slice(0, decimalIndex)
  const fractionalPart = digits.slice(decimalIndex)
  if (!/^0*$/.test(fractionalPart)) return null

  return integerPart.replace(/^0+/, '') || '0'
}

function getQueryParam (query, keys) {
  if (!query) return null

  const segments = query.split('&')
  for (const segment of segments) {
    if (!segment) continue
    const eqIndex = segment.indexOf('=')
    const rawKey = eqIndex === -1 ? segment : segment.slice(0, eqIndex)
    const rawValue = eqIndex === -1 ? '' : segment.slice(eqIndex + 1)

    let key
    try {
      key = decodeURIComponent(rawKey.replace(/\+/g, '%20'))
    } catch {
      continue
    }

    if (!keys.includes(key)) continue

    try {
      return decodeURIComponent(rawValue)
    } catch {
      return null
    }
  }

  return null
}

/**
 * Returns true if the input looks like an EIP-681 style request.
 * This is syntactic detection only (not a full validity check).
 *
 * @param {string} input
 * @returns {boolean}
 */
export function isEip681Request (input) {
  if (typeof input !== 'string') return false
  const trimmed = input.trim()
  if (!trimmed) return false

  if (!EIP681_PREFIX_REGEX.test(trimmed)) return false

  const scheme = trimmed.slice(0, trimmed.indexOf(':')).toLowerCase()
  if (!SUPPORTED_SCHEMES.includes(scheme)) return false

  return /@(\d+)\/[a-zA-Z0-9_]+(?:\?|$)/.test(trimmed)
}

/**
 * Parses an EIP-681 transfer request.
 * Supports:
 *   <scheme>:<tokenAddress>@<chainId>/transfer?address=<recipient>&uint256=<amount>
 * and `value` as an alias for `uint256`.
 *
 * @param {string} input
 * @returns {Eip681ParseResult}
 */
export function parseEip681Request (input) {
  if (typeof input !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const trimmed = input.trim()
  if (!isEip681Request(trimmed)) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const match = trimmed.match(
    /^([a-z][a-z0-9+.-]*):([^@/]+)@(\d+)\/([a-zA-Z0-9_]+)(?:\?(.+))?$/i
  )
  if (!match) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const scheme = match[1].toLowerCase()
  const tokenAddressRaw = match[2]
  const chainIdRaw = match[3]
  const method = match[4].toLowerCase()
  const query = match[5] ?? ''

  if (!SUPPORTED_SCHEMES.includes(scheme)) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  if (method !== 'transfer') {
    return { success: false, reason: 'UNSUPPORTED_METHOD' }
  }

  const tokenAddress = normalizeTokenAddress(tokenAddressRaw)
  if (tokenAddress == null) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const chainId = Number.parseInt(chainIdRaw, 10)
  if (!Number.isInteger(chainId) || chainId <= 0) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  const recipient = (getQueryParam(query, ['address']) ?? '').trim()
  const amountRaw = (getQueryParam(query, ['uint256', 'value']) ?? '').trim()

  if (!recipient || !amountRaw) {
    return { success: false, reason: 'MISSING_REQUIRED_PARAM' }
  }

  if (!validateEVMAddress(recipient).success) {
    return { success: false, reason: 'INVALID_RECIPIENT' }
  }

  const amountSmallest = scientificToIntegerString(amountRaw)
  if (amountSmallest == null) {
    return { success: false, reason: 'INVALID_AMOUNT' }
  }

  return {
    success: true,
    type: 'eip681-transfer',
    value: {
      recipient,
      tokenAddress,
      chainId,
      amountSmallest
    }
  }
}
