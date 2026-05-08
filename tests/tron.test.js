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

import { validateTronAddress } from '../src/address-validation/tron'

describe('validateTronAddress', () => {
  test('should return success for a valid Tron address', () => {
    const address = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL'
    expect(validateTronAddress(address)).toEqual({ success: true, type: 'tron' })
  })

  test('should return success for another valid Tron address', () => {
    const address = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
    expect(validateTronAddress(address)).toEqual({ success: true, type: 'tron' })
  })

  test('should return INVALID_FORMAT for an empty string', () => {
    const address = ''
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'EMPTY_ADDRESS' })
  })

  test('should return INVALID_FORMAT for a null address', () => {
    const address = null
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
  })

  test('should return INVALID_FORMAT for an undefined address', () => {
    const address = undefined
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
  })

  test('should return INVALID_FORMAT for a non-string address', () => {
    const address = 123
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
  })

  test('should return INVALID_FORMAT for an address that does not start with T', () => {
    const address = 'LNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL'
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
  })

  test('should return INVALID_FORMAT for an address with incorrect length (too short)', () => {
    const address = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqe'
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
  })

  test('should return INVALID_FORMAT for an address with incorrect length (too long)', () => {
    const address = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeL1'
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
  })

  test('should return INVALID_FORMAT for an address with invalid base58 characters', () => {
    const address = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeI' // 'I' is not a valid base58 character
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_FORMAT' })
  })

  test('should return INVALID_CHECKSUM for an address with a manipulated checksum', () => {
    const address = 'TNPeeaaFB7K9cmo4uQpcU32zGK8G1NYqeM' // last char changed
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_CHECKSUM' })
  })

  test('should return INVALID_CHECKSUM for an address with a slightly altered character', () => {
    const address = 'TNPefaaFB7K9cmo4uQpcU32zGK8G1NYqeL'
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_CHECKSUM' })
  })

  test('should return INVALID_PREFIX for an address with an invalid version byte', () => {
    const address = 'TZJozAg1ruapycCicgz31GxvYJ1G1qELV7'
    expect(validateTronAddress(address)).toEqual({ success: false, reason: 'INVALID_PREFIX' })
  })
})
