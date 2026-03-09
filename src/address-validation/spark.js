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
 * Spark address validation.
 * Accepts: Spark bech32 address (spark1...) OR alphanumeric string 20-100 chars.
 */

import { bech32m } from '@scure/base'

/**
 * @typedef {{ success: true, type: 'spark' | 'alphanumeric' }} SparkAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} SparkAddressValidationFailure
 * @typedef {SparkAddressValidationSuccess | SparkAddressValidationFailure} SparkAddressValidationResult
 */

/**
 * Validates a Spark address.
 * Accepts Spark bech32 format (spark1...) or alphanumeric string (20-100 chars).
 *
 * @param {string} address The address to validate.
 * @returns {SparkAddressValidationResult}
 */
export function validateSparkAddress (address) {
  if (!address || typeof address !== 'string') {
    return { success: false, reason: 'INVALID_FORMAT' }
  }
  const trimmed = address.trim()
  if (trimmed.length === 0) {
    return { success: false, reason: 'EMPTY_ADDRESS' }
  }
  const lower = trimmed.toLowerCase()
  if (lower.startsWith('spark1')) {
    if (trimmed !== lower) {
      return { success: false, reason: 'MIXED_CASE' }
    }
    try {
      const decoded = bech32m.decode(lower)
      if (decoded.prefix === 'spark') {
        return { success: true, type: 'spark' }
      }
    } catch {}
    return { success: false, reason: 'INVALID_BECH32_FORMAT' }
  }
  if (/^[a-zA-Z0-9]{20,100}$/.test(trimmed)) {
    return { success: true, type: 'alphanumeric' }
  }
  return { success: false, reason: 'INVALID_FORMAT' }
}
