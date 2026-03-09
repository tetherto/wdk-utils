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
 * Lightning validation.
 * Invoice prefixes: lnbc, lntb, lnbcrt, lni.
 * Lightning address: strict email (user@domain.tld).
 */

import { bech32 } from '@scure/base'

const VALID_INVOICE_PREFIXES = ['lnbc', 'lntb', 'lnbcrt', 'lni']
/** Lightning address: must have dot in domain (user@domain.tld) */
const LIGHTNING_ADDRESS_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Strips "lightning:" URI prefix (case-insensitive). Does not trim after slice.
 *
 * @param {string} input
 * @returns {string}
 */
export function stripLightningPrefix (input) {
  if (!input || typeof input !== 'string') return input
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('lightning:')) {
    return trimmed.slice(10)
  }
  return trimmed
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
  if (!address || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const invoice = stripLightningPrefix(address)
  const hasValidPrefix = VALID_INVOICE_PREFIXES.some((prefix) =>
    invoice.toLowerCase().startsWith(prefix.toLowerCase())
  )
  if (!hasValidPrefix) {
    return { success: false, reason: 'INVALID_PREFIX' }
  }
  if (invoice.length < 20) {
    return { success: false, reason: 'INVALID_LENGTH' }
  }
  try {
    bech32.decode(invoice.toLowerCase(), false)
    return { success: true, type: 'invoice' }
  } catch {
    return { success: false, reason: 'INVALID_CHECKSUM' }
  }
}

/**
 * @typedef {{ success: true, type: 'lnurl' }} LnurlValidationSuccess
 * @typedef {{ success: false, reason: string }} LnurlValidationFailure
 * @typedef {LnurlValidationSuccess | LnurlValidationFailure} LnurlValidationResult
 */

/**
 * Validates an LNURL address (lnurl1... bech32 encoded URL).
 *
 * @param {string} address The LNURL to validate.
 * @returns {LnurlValidationResult}
 */
export function validateLnurl (address) {
  if (!address || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const lower = address.trim().toLowerCase()
  if (!lower) {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  if (!lower.startsWith('lnurl1')) {
    return { success: false, reason: 'INVALID_PREFIX' }
  }
  try {
    bech32.decode(lower, 2000)
    return { success: true, type: 'lnurl' }
  } catch {}
  return { success: false, reason: 'INVALID_BECH32_FORMAT' }
}

/**
 * @typedef {{ success: true, type: 'address' }} LightningAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} LightningAddressValidationFailure
 * @typedef {LightningAddressValidationSuccess | LightningAddressValidationFailure} LightningAddressValidationResult
 */

/**
 * Validates Lightning Address format (email: user@domain.tld).
 *
 * @param {string} address The address to validate.
 * @returns {LightningAddressValidationResult}
 */
export function validateLightningAddress (address) {
  if (!address || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const trimmed = address.trim().toLowerCase()
  if (LIGHTNING_ADDRESS_EMAIL_REGEX.test(trimmed)) {
    return { success: true, type: 'address' }
  }
  return { success: false, reason: 'INVALID_FORMAT' }
}
