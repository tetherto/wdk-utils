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

import { gcm } from '@noble/ciphers/aes.js'
import { clean } from '@noble/ciphers/utils.js'
import { scrypt } from '@noble/hashes/scrypt.js'
import {
  bytesToHex,
  bytesToUtf8,
  hexToBytes,
  randomBytes,
  utf8ToBytes
} from '@noble/hashes/utils.js'

/**
 * @typedef {Object} ScryptParams
 * @property {number} [N] - scrypt CPU/memory cost parameter (power of 2).
 * @property {number} [r] - scrypt block size parameter.
 * @property {number} [p] - scrypt parallelization parameter.
 */

/**
 * @typedef {Object} EncryptedPayload
 * @property {1} version - The payload format version.
 * @property {string} salt - The scrypt salt (hex).
 * @property {string} iv - The AES-GCM initialization vector (hex).
 * @property {string} tag - The AES-GCM authentication tag (hex).
 * @property {string} ciphertext - The encrypted payload (hex).
 * @property {number} [scryptN] - scrypt N used for key derivation.
 * @property {number} [scryptR] - scrypt r used for key derivation.
 * @property {number} [scryptP] - scrypt p used for key derivation.
 */

const KEY_LEN = 32
const SALT_LEN = 32
const IV_LEN = 12
const GCM_TAG_LEN = 16
const SCRYPT_MAX_MEM = 128 * 1024 * 1024

/** @type {Required<ScryptParams>} */
export const DEFAULT_SCRYPT_PARAMS = {
  N: 2 ** 16,
  r: 8,
  p: 1
}

/**
 * @param {ScryptParams | EncryptedPayload} [params]
 * @returns {Required<ScryptParams>}
 */
function resolveScryptParams (params = {}) {
  return {
    N: params.N ?? params.scryptN ?? DEFAULT_SCRYPT_PARAMS.N,
    r: params.r ?? params.scryptR ?? DEFAULT_SCRYPT_PARAMS.r,
    p: params.p ?? params.scryptP ?? DEFAULT_SCRYPT_PARAMS.p
  }
}

/**
 * @param {Required<ScryptParams>} scryptParams
 * @returns {number}
 */
function scryptMaxMem (scryptParams) {
  const { N, r, p } = scryptParams
  return Math.max(SCRYPT_MAX_MEM, 128 * r * (N + p))
}

/**
 * Derives a 32-byte encryption key from a password and salt using scrypt.
 *
 * @param {string} password - The passphrase.
 * @param {Uint8Array} salt - The salt bytes.
 * @param {ScryptParams} [scryptParams] - Optional scrypt cost parameters.
 * @returns {Uint8Array} The derived key bytes.
 */
export function deriveKey (password, salt, scryptParams) {
  const resolved = resolveScryptParams(scryptParams)
  return scrypt(password, salt, {
    N: resolved.N,
    r: resolved.r,
    p: resolved.p,
    dkLen: KEY_LEN,
    maxmem: scryptMaxMem(resolved)
  })
}

/**
 * Encrypts a plaintext string with AES-256-GCM using a password-derived key.
 *
 * @param {string} plaintext - The string to encrypt.
 * @param {string} password - The passphrase used to derive the key.
 * @param {ScryptParams} [scryptParams] - Optional scrypt cost parameters.
 * @returns {EncryptedPayload} The encrypted payload including salt, IV, tag, and ciphertext.
 */
export function encrypt (plaintext, password, scryptParams) {
  const resolved = resolveScryptParams(scryptParams)
  const salt = randomBytes(SALT_LEN)
  const key = deriveKey(password, salt, resolved)
  const iv = randomBytes(IV_LEN)

  try {
    const sealed = gcm(key, iv).encrypt(utf8ToBytes(plaintext))
    const tag = sealed.subarray(sealed.length - GCM_TAG_LEN)
    const ciphertext = sealed.subarray(0, sealed.length - GCM_TAG_LEN)

    return {
      version: 1,
      salt: bytesToHex(salt),
      iv: bytesToHex(iv),
      tag: bytesToHex(tag),
      ciphertext: bytesToHex(ciphertext),
      scryptN: resolved.N,
      scryptR: resolved.r,
      scryptP: resolved.p
    }
  } finally {
    clean(key)
  }
}

/**
 * Decrypts an encrypted payload using a pre-derived key.
 *
 * @param {EncryptedPayload} payload - The encrypted payload.
 * @param {Uint8Array} key - The 32-byte AES key.
 * @returns {string} The decrypted plaintext.
 */
export function decryptWithKey (payload, key) {
  if (payload.version !== 1) {
    throw new Error(`Unsupported keyring version: ${payload.version}`)
  }
  const iv = hexToBytes(payload.iv)
  const tag = hexToBytes(payload.tag)
  const ciphertext = hexToBytes(payload.ciphertext)
  const sealed = new Uint8Array(ciphertext.length + tag.length)
  sealed.set(ciphertext)
  sealed.set(tag, ciphertext.length)
  return bytesToUtf8(gcm(key, iv).decrypt(sealed))
}

/**
 * Decrypts an encrypted payload using a password.
 *
 * @param {EncryptedPayload} payload - The encrypted payload.
 * @param {string} password - The passphrase used to derive the key.
 * @returns {string} The decrypted plaintext.
 */
export function decrypt (payload, password) {
  if (payload.version !== 1) {
    throw new Error(`Unsupported keyring version: ${payload.version}`)
  }
  const salt = hexToBytes(payload.salt)
  const key = deriveKey(password, salt, payload)
  try {
    return decryptWithKey(payload, key)
  } finally {
    clean(key)
  }
}
