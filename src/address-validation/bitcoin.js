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
import { sha256 } from '@noble/hashes/sha2.js'

/** @typedef {import("./types.js").AddressValidationFailure} BtcAddressValidationFailure */
/** @typedef {'bitcoin' | 'testnet' | 'regtest'} BtcNetwork */
/** @typedef {{ success: true, type: 'p2pkh' | 'p2sh' | 'bech32' | 'bech32m', compatibleNetworks: BtcNetwork[] }} BtcAddressValidationSuccess */
/** @typedef {BtcAddressValidationSuccess | BtcAddressValidationFailure} BtcAddressValidationResult */

/**
 * Bitcoin address validation.
 * Validates format and checksum for bitcoin, testnet, and regtest addresses.
 * Supports P2PKH, P2SH, SegWit v0 (Bech32), and SegWit v1+ (Bech32m).
 */

const base58check = createBase58check(sha256)

const NETWORKS = {
  bitcoin: {
    bech32: 'bc',
    p2pkh: 0x00,
    p2sh: 0x05
  },
  testnet: {
    bech32: 'tb',
    p2pkh: 0x6f,
    p2sh: 0xc4
  },
  regtest: {
    bech32: 'bcrt'
    // Regtest reuses testnet's Base58 version bytes (0x6f/0xc4)
  }
}

const WITNESS_VERSION_BECH32 = 0

// BIP-173 / BIP-350: segwit addresses carry a witness version between 0 and 16.
const MAX_WITNESS_VERSION = 16

/**
 * Decodes a Base58Check address and validates its payload length.
 * Returns decoded bytes or a failure result.
 * @param {string} address
 * @returns {{ decoded: Uint8Array } | BtcAddressValidationFailure}
 */
function _decodeBase58 (address) {
  let decoded

  try {
    decoded = base58check.decode(address)
  } catch (e) {
    const msg = e && e.message ? e.message.toLowerCase() : ''

    if (msg.includes('checksum')) {
      return { success: false, reason: 'INVALID_CHECKSUM' }
    }

    return { success: false, reason: 'INVALID_FORMAT' }
  }

  if (decoded.length !== 21) {
    return { success: false, reason: 'INVALID_LENGTH' }
  }

  return { decoded }
}

/**
 * Validates a P2PKH address for any supported network.
 * @param {Uint8Array} decoded - The decoded address
 * @returns {BtcAddressValidationResult}
 */
function _validateP2PKH (decoded) {
  const version = decoded[0]
  if (version === NETWORKS.bitcoin.p2pkh) {
    return { success: true, type: 'p2pkh', compatibleNetworks: ['bitcoin'] }
  }
  if (version === NETWORKS.testnet.p2pkh) {
    // Testnet and regtest share Base58 version bytes, so the address is valid on both.
    return { success: true, type: 'p2pkh', compatibleNetworks: ['testnet', 'regtest'] }
  }

  return { success: false, reason: 'INVALID_VERSION_BYTE' }
}

/**
 * Validates a P2SH address for any supported network.
 * @param {Uint8Array} decoded - The decoded address
 * @returns {BtcAddressValidationResult}
 */
function _validateP2SH (decoded) {
  const version = decoded[0]

  if (version === NETWORKS.bitcoin.p2sh) {
    return { success: true, type: 'p2sh', compatibleNetworks: ['bitcoin'] }
  }

  if (version === NETWORKS.testnet.p2sh) {
    // Testnet and regtest share Base58 version bytes, so the address is valid on both.
    return { success: true, type: 'p2sh', compatibleNetworks: ['testnet', 'regtest'] }
  }

  return { success: false, reason: 'INVALID_VERSION_BYTE' }
}

export function validateBase58 (address) {
  const result = _decodeBase58(address)
  if (!result.decoded) return result

  const validateP2pkh = _validateP2PKH(result.decoded)
  if (validateP2pkh.success) {
    return validateP2pkh
  }

  const validateP2sh = _validateP2SH(result.decoded)
  if (validateP2sh.success) {
    return validateP2sh
  }

  return { success: false, reason: 'INVALID_VERSION_BYTE' }
}

/**
 * Validates a Bech32 address for any supported network.
 * @param {string} address - The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateBech32 (address) {
  try {
    const decoded = bech32.decode(address)
    const { words } = decoded

    if (words[0] !== WITNESS_VERSION_BECH32) {
      return { success: false, reason: 'INVALID_WITNESS_VERSION' }
    }

    const programBytes = bech32.fromWords(words.slice(1))
    if (programBytes.length !== 20 && programBytes.length !== 32) {
      return { success: false, reason: 'INVALID_LENGTH' }
    }

    const prefix = address.toLowerCase().substring(0, address.lastIndexOf('1'))
    if (prefix === NETWORKS.bitcoin.bech32) return { success: true, type: 'bech32', compatibleNetworks: ['bitcoin'] }
    if (prefix === NETWORKS.testnet.bech32) return { success: true, type: 'bech32', compatibleNetworks: ['testnet'] }
    if (prefix === NETWORKS.regtest.bech32) return { success: true, type: 'bech32', compatibleNetworks: ['regtest'] }

    return { success: false, reason: 'INVALID_HRP' }
  } catch (e) {
    if (e && e.message && e.message.toLowerCase().includes('lowercase or uppercase')) {
      return { success: false, reason: 'MIXED_CASE' }
    }
    return { success: false, reason: 'INVALID_BECH32_FORMAT' }
  }
}

/**
 * Validates a Bech32m address for any supported network.
 * @param {string} address - The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateBech32m (address) {
  try {
    const decoded = bech32m.decode(address)
    const { words } = decoded

    if (words[0] === WITNESS_VERSION_BECH32 || words[0] > MAX_WITNESS_VERSION) {
      return { success: false, reason: 'INVALID_WITNESS_VERSION' }
    }

    const programBytes = bech32m.fromWords(words.slice(1))
    // As per BIP-173, valid witness programs are 2-40 bytes.
    if (programBytes.length < 2 || programBytes.length > 40) {
      return { success: false, reason: 'INVALID_LENGTH' }
    }

    const prefix = address.toLowerCase().substring(0, address.lastIndexOf('1'))
    if (prefix === NETWORKS.bitcoin.bech32) return { success: true, type: 'bech32m', compatibleNetworks: ['bitcoin'] }
    if (prefix === NETWORKS.testnet.bech32) return { success: true, type: 'bech32m', compatibleNetworks: ['testnet'] }
    if (prefix === NETWORKS.regtest.bech32) return { success: true, type: 'bech32m', compatibleNetworks: ['regtest'] }

    return { success: false, reason: 'INVALID_HRP' }
  } catch (e) {
    if (e && e.message && e.message.toLowerCase().includes('lowercase or uppercase')) {
      return { success: false, reason: 'MIXED_CASE' }
    }
    return { success: false, reason: 'INVALID_BECH32M_FORMAT' }
  }
}

/**
 * Validates a Bitcoin address for any supported network.
 *
 * @param {string} address The address to validate.
 * @returns {BtcAddressValidationResult}
 */
export function validateBitcoinAddress (address) {
  if (address == null || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const trimmed = address.trim()
  if (trimmed.length === 0) {
    return { success: false, reason: 'EMPTY_ADDRESS' }
  }

  const results = [
    validateBase58(trimmed),
    validateBech32(trimmed),
    validateBech32m(trimmed)
  ]

  const successes = results.filter(r => r.success)

  if (successes.length === 1) {
    return successes[0]
  }

  if (successes.length > 1) {
    return { success: false, reason: 'AMBIGUOUS_ADDRESS' }
  }

  const failures = results

  const definitiveFailure = failures.find(f =>
    f.reason !== 'INVALID_FORMAT' &&
    f.reason !== 'INVALID_BECH32_FORMAT' &&
    f.reason !== 'INVALID_BECH32M_FORMAT'
  )

  if (definitiveFailure) {
    return definitiveFailure
  }

  return { success: false, reason: 'INVALID_FORMAT' }
}
