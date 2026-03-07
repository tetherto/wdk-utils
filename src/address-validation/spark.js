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
 * Accepts: Bitcoin-like address OR alphanumeric string 20-100 chars.
 */

import { validateBitcoinAddress } from './bitcoin.js'

/**
 * @typedef {{ success: true, type: 'btc' | 'alphanumeric' }} SparkAddressValidationSuccess
 * @typedef {{ success: false, reason: string }} SparkAddressValidationFailure
 * @typedef {SparkAddressValidationSuccess | SparkAddressValidationFailure} SparkAddressValidationResult
 */

/**
 * Validates a Spark address.
 * Accepts Bitcoin format or alphanumeric string (20-100 chars).
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
  if (validateBitcoinAddress(trimmed).success) {
    return { success: true, type: 'btc' }
  }
  if (trimmed.length >= 20 && trimmed.length <= 100 && /^[a-zA-Z0-9]+$/.test(trimmed)) {
    return { success: true, type: 'alphanumeric' }
  }
  return { success: false, reason: 'INVALID_FORMAT' }
}
