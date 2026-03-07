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

/**
 * EVM address validation.
 * EIP-55 checksum: if all lowercase, valid; if mixed case, must match checksum.
 * @see https://eips.ethereum.org/EIPS/eip-55
 */

// eslint-disable-next-line camelcase
import { keccak_256 } from '@noble/hashes/sha3'

function isValidEIP55Checksum (address) {
  const hexPart = address.slice(2)
  if (hexPart === hexPart.toLowerCase()) {
    return true
  }
  const addressLower = address.toLowerCase()
  const addressWithoutPrefix = addressLower.slice(2)
  try {
    const addressBytes = new TextEncoder().encode(addressWithoutPrefix)
    const hashBytes = keccak_256(addressBytes)
    const hash = Array.from(hashBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
    let checksummed = '0x'
    for (let i = 0; i < addressWithoutPrefix.length; i++) {
      const char = addressWithoutPrefix[i]
      const hashChar = hash[i]
      if (parseInt(hashChar, 16) >= 8) {
        checksummed += char.toUpperCase()
      } else {
        checksummed += char
      }
    }
    return address === checksummed
  } catch {
    return false
  }
}

/**
 * @typedef {{ success: true, type: 'evm' }} EvmAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} EvmAddressValidationFailure
 * @typedef {EvmAddressValidationSuccess | EvmAddressValidationFailure} EvmAddressValidationResult
 */

/**
 * Validates an EVM address (format + optional EIP-55 checksum).
 * If mixed case, checksum must match; all lowercase or all uppercase is valid.
 *
 * @param {string} address The address to validate.
 * @returns {EvmAddressValidationResult}
 */
export function validateEVMAddress (address) {
  if (!address || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const trimmed = address.trim()
  if (!trimmed.startsWith('0x') || trimmed.length !== 42) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const hexPart = trimmed.slice(2)
  if (!/^[0-9a-fA-F]{40}$/.test(hexPart)) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const isAllLowercase = hexPart === hexPart.toLowerCase()
  const isAllUppercase = hexPart === hexPart.toUpperCase()
  const hasMixedCase = !isAllLowercase && !isAllUppercase
  if (hasMixedCase && !isValidEIP55Checksum(trimmed)) {
    return { success: false, reason: 'INVALID_CHECKSUM' }
  }
  return { success: true, type: 'evm' }
}
