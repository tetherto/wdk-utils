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

import { validateAddress } from '../src/address-validation/validate-address.js'

describe('validateAddress', () => {
  it('dispatches bip122 chain ids to the Bitcoin validator', () => {
    const result = validateAddress('bip122:000000000019d6689c085ae165831e93', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

    expect(result).toEqual({ success: true, type: 'p2pkh', compatibleNetworks: ['bitcoin'] })
  })

  it('dispatches eip155 chain ids to the EVM validator', () => {
    const result = validateAddress('eip155:1', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e')

    expect(result).toEqual({ success: true, type: 'evm' })
  })

  it('dispatches solana chain ids to the Solana validator', () => {
    const result = validateAddress('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB')

    expect(result).toEqual({ success: true, type: 'solana' })
  })

  it('dispatches spark chain ids to the Spark validator', () => {
    const result = validateAddress('spark:mainnet', 'spark1pgss82uvuvyjggx72gl42qk3285yz0j6lgxw9uk2mvgajsr8w22nudv8w6hqs2')

    expect(result).toEqual({ success: true, type: 'spark', compatibleNetworks: ['mainnet'] })
  })

  it('dispatches tron chain ids to the Tron validator', () => {
    const result = validateAddress('tron:mainnet', 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')

    expect(result).toEqual({ success: true, type: 'tron' })
  })

  it('dispatches ton chain ids to the Ton validator', () => {
    const result = validateAddress('ton:mainnet', 'EQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPrHF')

    expect(result).toEqual({ success: true, type: 'ton' })
  })

  it('accepts a bare chain namespace without a reference', () => {
    const result = validateAddress('eip155', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e')

    expect(result).toEqual({ success: true, type: 'evm' })
  })

  it('returns the chain validator failure unchanged', () => {
    const result = validateAddress('eip155:1', 'not-an-address')

    expect(result).toEqual({ success: false, reason: 'INVALID_FORMAT' })
  })

  it('returns UNSUPPORTED_CHAIN for a chain namespace without a validator', () => {
    const result = validateAddress('cosmos:cosmoshub-4', 'cosmos1qypqxpq9qcrsszg2pvxq6rs0zqg3yyc5lzv7xu')

    expect(result).toEqual({ success: false, reason: 'UNSUPPORTED_CHAIN' })
  })

  it('rejects a testnet address for the Bitcoin mainnet chain id', () => {
    const result = validateAddress('bip122:000000000019d6689c085ae165831e93', 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')

    expect(result).toEqual({ success: false, reason: 'NETWORK_MISMATCH' })
  })

  it('rejects a mainnet address for the Bitcoin testnet chain id', () => {
    const result = validateAddress('bip122:000000000933ea01ad0ee984209779ba', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

    expect(result).toEqual({ success: false, reason: 'NETWORK_MISMATCH' })
  })

  it('rejects an unknown bip122 reference', () => {
    const result = validateAddress('bip122:ffffffffffffffffffffffffffffffff', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

    expect(result).toEqual({ success: false, reason: 'NETWORK_MISMATCH' })
  })

  it('rejects a bare bip122 namespace without a reference', () => {
    const result = validateAddress('bip122', 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')

    expect(result).toEqual({ success: false, reason: 'NETWORK_MISMATCH' })
  })

  it('rejects malformed chain ids', () => {
    expect(validateAddress('eip155:', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toEqual({ success: false, reason: 'INVALID_CHAIN_ID' })
    expect(validateAddress('eip155:1:extra', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toEqual({ success: false, reason: 'INVALID_CHAIN_ID' })
  })

  it('rejects a non-string chain id', () => {
    expect(validateAddress(null, '0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toEqual({ success: false, reason: 'INVALID_CHAIN_ID' })
    expect(validateAddress(undefined, '0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toEqual({ success: false, reason: 'INVALID_CHAIN_ID' })
    expect(validateAddress(1, '0x742d35Cc6634C0532925a3b844Bc454e4438f44e')).toEqual({ success: false, reason: 'INVALID_CHAIN_ID' })
  })

  it('accepts a legacy testnet-format address for the Bitcoin regtest chain id', () => {
    const result = validateAddress('bip122:0f9188f13cb7b2c71f2a335e3a4fc328', 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn')

    expect(result).toEqual({ success: true, type: 'p2pkh', compatibleNetworks: ['testnet', 'regtest'] })
  })

  it('accepts a legacy testnet-format p2sh address for the Bitcoin regtest chain id', () => {
    const result = validateAddress('bip122:0f9188f13cb7b2c71f2a335e3a4fc328', '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc')

    expect(result).toEqual({ success: true, type: 'p2sh', compatibleNetworks: ['testnet', 'regtest'] })
  })

  it('accepts a native segwit (bech32) regtest address for the Bitcoin regtest chain id', () => {
    const result = validateAddress('bip122:0f9188f13cb7b2c71f2a335e3a4fc328', 'bcrt1qquv9lg5g2r4jkr0ahun0ddfg5xntxjelwjpnuw')

    expect(result).toEqual({ success: true, type: 'bech32', compatibleNetworks: ['regtest'] })
  })

  it('rejects a bech32 testnet address for the Bitcoin regtest chain id', () => {
    const result = validateAddress('bip122:0f9188f13cb7b2c71f2a335e3a4fc328', 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')

    expect(result).toEqual({ success: false, reason: 'NETWORK_MISMATCH' })
  })

  it('accepts a Bitcoin L1 deposit address for the Spark mainnet chain id', () => {
    const result = validateAddress('spark:mainnet', 'bc1p4lpn5nrunrjdk6teyjd2z53vmv82hlgjvv4pejkhg9wz5jq86zuqsruz85')

    expect(result).toEqual({ success: true, type: 'btc', compatibleNetworks: ['mainnet'] })
  })

  it('rejects a Spark address from another network', () => {
    const result = validateAddress('spark:mainnet', 'sparkrt1pgss82uvuvyjggx72gl42qk3285yz0j6lgxw9uk2mvgajsr8w22nudv8uueuu4')

    expect(result).toEqual({ success: false, reason: 'NETWORK_MISMATCH' })
  })

  it('rejects a testnet L1 address for the Spark mainnet chain id', () => {
    const result = validateAddress('spark:mainnet', 'tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq47zagq')

    expect(result).toEqual({ success: false, reason: 'NETWORK_MISMATCH' })
  })

  it('accepts a Spark regtest address for the Spark regtest chain id', () => {
    const result = validateAddress('spark:regtest', 'sparkrt1pgss82uvuvyjggx72gl42qk3285yz0j6lgxw9uk2mvgajsr8w22nudv8uueuu4')

    expect(result).toEqual({ success: true, type: 'spark', compatibleNetworks: ['regtest'] })
  })

  it('accepts a testnet L1 address for the Spark signet chain id', () => {
    const result = validateAddress('spark:signet', 'tb1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq47zagq')

    expect(result).toEqual({ success: true, type: 'btc', compatibleNetworks: ['testnet', 'signet'] })
  })

  it('accepts a regtest L1 address for the Spark local chain id', () => {
    const result = validateAddress('spark:local', 'bcrt1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqc8gma6')

    expect(result).toEqual({ success: true, type: 'btc', compatibleNetworks: ['regtest', 'local'] })
  })
})
