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
 * Universal Money Address (UMA) validation.
 * Format: $user@domain.tld (human-readable, like email for money; built on Lightning).
 * Resolves UMA usernames into the underlying Lightning Address (user@domain).
 */

/** UMA format: leading $ then local@domain with dot in domain */
const UMA_REGEX = /^\$([^\s@]+)@([^\s@]+\.[^\s@]+)$/

/**
 * @typedef {{ success: true, type: 'uma' }} UmaAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} UmaAddressValidationFailure
 * @typedef {UmaAddressValidationSuccess | UmaAddressValidationFailure} UmaAddressValidationResult
 */

/**
 * Validates a Universal Money Address (format: $user@domain.tld).
 *
 * @param {string} address The address to validate.
 * @returns {UmaAddressValidationResult}
 */
export function validateUmaAddress (address) {
  if (!address || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  if (UMA_REGEX.test(address.trim())) {
    return { success: true, type: 'uma' }
  }
  return { success: false, reason: 'INVALID_FORMAT' }
}

/**
 * Resolves UMA username into address components and the underlying Lightning Address.
 * UMA is built on Lightning Addresses; this returns the user@domain form used for resolution.
 *
 * @param {string} uma - UMA string (e.g. $you@uma.money)
 * @returns {{ localPart: string; domain: string; lightningAddress: string } | null} Parsed parts and lightningAddress (user@domain), or null if invalid
 */
export function resolveUmaUsername (uma) {
  if (!uma || typeof uma !== 'string') return null
  const trimmed = uma.trim()
  const match = trimmed.match(UMA_REGEX)
  if (!match) return null
  const [, localPart, domain] = match
  const lightningAddress = `${localPart}@${domain}`
  return { localPart, domain, lightningAddress }
}
