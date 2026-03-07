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

import { createBase58check, bech32, bech32m } from '@scure/base'
import { sha256 } from '@noble/hashes/sha2'

/**
 * Bitcoin address validation.
 * Validates format, checksum, and version byte.
 */

const base58check = createBase58check(sha256)

/**
 * @typedef {{ success: true, type: 'p2pkh' | 'p2sh' | 'bech32' }} BtcAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} BtcAddressValidationFailure
 * @typedef {BtcAddressValidationSuccess | BtcAddressValidationFailure} BtcAddressValidationResult
 */

/**
 * Validates a P2PKH address.
 * Assumes the address starts with '1'.
 * @param {string} address The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateP2PKH (address) {
  if (address.length < 26 || address.length > 35) {
    return { success: false, reason: 'INVALID_LENGTH' }
  }
  try {
    const decoded = base58check.decode(address)
    if (decoded[0] === 0x00) {
      return { success: true, type: 'p2pkh' }
    } else {
      return { success: false, reason: 'INVALID_VERSION_BYTE' }
    }
  } catch {
    return { success: false, reason: 'INVALID_CHECKSUM' }
  }
}

/**
 * Validates a P2SH address.
 * Assumes the address starts with '3'.
 * @param {string} address The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateP2SH (address) {
  if (address.length < 26 || address.length > 35) {
    return { success: false, reason: 'INVALID_LENGTH' }
  }
  try {
    const decoded = base58check.decode(address)
    if (decoded[0] === 0x05) {
      return { success: true, type: 'p2sh' }
    } else {
      return { success: false, reason: 'INVALID_VERSION_BYTE' }
    }
  } catch {
    return { success: false, reason: 'INVALID_CHECKSUM' }
  }
}

/**
 * Validates a Bech32 or Bech32m address.
 * Assumes the address starts with 'bc1' (case-insensitive).
 * @param {string} address The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateBech32 (address) {
  const lower = address.toLowerCase()
  const upper = address.toUpperCase()
  if (address !== lower && address !== upper) {
    return { success: false, reason: 'MIXED_CASE' }
  }

  let decoded
  try {
    decoded = bech32.decode(lower)
  } catch (e) {
    try {
      decoded = bech32m.decode(lower)
    } catch (e2) {
      return { success: false, reason: 'INVALID_BECH32_FORMAT' }
    }
  }

  if (decoded.prefix === 'bc') {
    return { success: true, type: 'bech32' }
  } else {
    return { success: false, reason: 'INVALID_HRP' }
  }
}

/**
 * Validates a Bitcoin address and returns a detailed result.
 * Supports: P2PKH (1...), P2SH (3...), Bech32 (bc1...).
 *
 * @param {string} address
 * @returns {BtcAddressValidationResult}
 */
export function validateBitcoinAddress (address) {
  if (!address || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const t = address.trim()

  if (t.length === 0) {
    return { success: false, reason: 'EMPTY_ADDRESS' }
  }

  if (t.toLowerCase().startsWith('bc1')) {
    return validateBech32(t)
  }
  if (t.startsWith('1')) {
    return validateP2PKH(t)
  }
  if (t.startsWith('3')) {
    return validateP2SH(t)
  }

  return { success: false, reason: 'UNKNOWN_PREFIX' }
}
