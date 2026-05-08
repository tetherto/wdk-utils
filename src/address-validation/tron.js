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

import { sha256 } from '@noble/hashes/sha2'
import { base58 } from '@scure/base'

const TRON_ADDRESS_PREFIX_BYTE = 0x41
const TRON_ADDRESS_PREFIX = 'T'
const TRON_ADDRESS_LENGTH = 34

/**
 * @typedef {{ success: true, type: 'tron' }} TronAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} TronAddressValidationFailure
 * @typedef {TronAddressValidationSuccess | TronAddressValidationFailure} TronAddressValidationResult
 */

/**
 * Validates a Tron address.
 *
 * @param {string} address The address to validate.
 * @returns {TronAddressValidationResult}
 */
export function validateTronAddress (address) {
  if (address == null || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const trimmed = address.trim()
  if (trimmed.length === 0) {
    return { success: false, reason: 'EMPTY_ADDRESS' }
  }

  if (!trimmed.startsWith(TRON_ADDRESS_PREFIX) || trimmed.length !== TRON_ADDRESS_LENGTH) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }

  try {
    const decoded = base58.decode(trimmed)

    if (decoded[0] !== TRON_ADDRESS_PREFIX_BYTE) {
      return { success: false, reason: 'INVALID_PREFIX' }
    }
    const payload = decoded.slice(0, -4)
    const checksum = decoded.slice(-4)

    const hash1 = sha256(payload)
    const hash2 = sha256(hash1)

    const expectedChecksum = hash2.slice(0, 4)

    if (checksum.every((value, index) => value === expectedChecksum[index])) {
      return { success: true, type: 'tron' }
    } else {
      return { success: false, reason: 'INVALID_CHECKSUM' }
    }
  } catch (e) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
}
