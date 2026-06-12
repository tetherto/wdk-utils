# @tetherto/wdk-utils

A collection of utilities for validating cryptocurrency addresses and payment URIs. This package provides a set of functions to validate various address formats and parse payment requests from different blockchain networks.

## 🔍 About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://wallet.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control. 

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## 🌟 Features

- **Bitcoin Address Validation**: Supports P2PKH, P2SH, and Bech32 address formats.
- **BIP-21 Payment URI Support**: Parses and encodes `bitcoin:` payment URIs including optional amount, label, and message parameters.
- **EVM Address Validation**: Validates Ethereum-like addresses, including EIP-55 checksum validation.
- **EIP-681 Payment Request Parsing**: Parses Ethereum payment request URIs for token transfers.
- **Lightning Network Validation**: Validates Lightning invoices and Lightning addresses.
- **Spark Address Validation**: Supports Spark address formats.
- **UMA Address Validation**: Validates Universal Money Addresses.

## ⬇️ Installation

You can install the package using npm:

```bash
npm install @tetherto/wdk-utils
```

## 🚀 Quick Start

### Importing validation functions

```javascript
import {
  validateBitcoinAddress,
  isBip21Request,
  parseBip21Request,
  encodeBip21Request,
  validateEVMAddress,
  isEip681Request,
  parseEip681Request,
  validateLightningInvoice,
  validateLightningAddress,
  validateSparkAddress,
  validateUmaAddress
} from '@tetherto/wdk-utils'
```

### Usage Examples

```javascript
// Bitcoin Address Validation
const btcResult = validateBitcoinAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
console.log(btcResult) // { success: true, type: 'bech32', network: 'mainnet' }

// BIP-21 Payment URI Parsing
const bip21Result = parseBip21Request('bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.001&label=Donation')
console.log(bip21Result)
// { success: true, type: 'bip21', value: { address: 'bc1q...', amount: '0.001', label: 'Donation' } }

// BIP-21 Payment URI Encoding
const bip21Uri = encodeBip21Request({ address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', amount: '0.001', label: 'Donation' })
console.log(bip21Uri) // 'bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh?amount=0.001&label=Donation'

// EVM Address Validation
const evmResult = validateEVMAddress('0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe')
console.log(evmResult) // { success: true, type: 'evm' }

// Lightning Invoice Validation
const lnInvoiceResult = validateLightningInvoice('lnbc...')
console.log(lnInvoiceResult) // { success: true, type: 'invoice' }

// Lightning Address Validation
const lnAddressResult = validateLightningAddress('user@domain.com')
console.log(lnAddressResult) // { success: true, type: 'address' }

// Spark Address Validation
const sparkResult = validateSparkAddress('...')
console.log(sparkResult) // { success: true, type: 'btc' | 'alphanumeric' }

// UMA Address Validation
const umaResult = validateUmaAddress('$user@domain.com')
console.log(umaResult) // { success: true, type: 'uma' }
```

## 📚 API Reference

### Address Validation

| Function | Input | Returns on success | Returns on failure |
|---|---|---|---|
| `validateBitcoinAddress(address)` | Bitcoin address string | `{ success: true, type: 'p2pkh' \| 'p2sh' \| 'bech32' \| 'bech32m', network: 'mainnet' \| 'testnet' \| 'regtest' }` | `{ success: false, reason: string }` |
| `validateEVMAddress(address)` | EVM address string | `{ success: true, type: 'evm' }` | `{ success: false, reason: string }` |
| `validateLightningInvoice(invoice)` | BOLT-11 invoice string | `{ success: true, type: 'invoice' }` | `{ success: false, reason: string }` |
| `validateLightningAddress(address)` | Lightning address string | `{ success: true, type: 'address' }` | `{ success: false, reason: string }` |
| `validateSparkAddress(address)` | Spark address string | `{ success: true, type: 'btc' \| 'alphanumeric' }` | `{ success: false, reason: string }` |
| `validateUmaAddress(address)` | UMA string (`$user@domain`) | `{ success: true, type: 'uma' }` | `{ success: false, reason: string }` |

### Payment URI Parsing

#### BIP-21 — Bitcoin Payment URIs

| Function | Input | Description |
|---|---|---|
| `isBip21Request(input)` | `string` | Returns `true` if the input looks like a `bitcoin:` URI (syntactic check only, no validation) |
| `parseBip21Request(input)` | `string` | Fully parses and validates a BIP-21 URI |
| `encodeBip21Request(request)` | `Bip21Request` | Encodes a `Bip21Request` object into a `bitcoin:` URI string |

`parseBip21Request` return shape:

```typescript
// Success
{ success: true, type: 'bip21', value: {
  address: string       // validated Bitcoin address
  amount?: string       // decimal BTC amount (e.g. '0.001')
  label?: string        // URL-decoded label
  message?: string      // URL-decoded message
}}

// Failure
{ success: false, reason:
  | 'INVALID_FORMAT'              // not a bitcoin: URI or missing address
  | 'INVALID_ADDRESS'             // address fails Bitcoin validation
  | 'INVALID_AMOUNT'              // amount is not a valid decimal BTC value
  | 'UNSUPPORTED_REQUIRED_PARAM'  // unknown req-* parameter present
}
```

#### EIP-681 — Ethereum Payment Request URIs

| Function | Input | Description |
|---|---|---|
| `isEip681Request(input)` | `string` | Returns `true` if the input looks like an EIP-681 URI (syntactic check only) |
| `parseEip681Request(input)` | `string` | Fully parses and validates an EIP-681 URI |

`parseEip681Request` return shape:

```typescript
// Success
{ success: true, type: 'eip681-transfer', value: {
  recipient: string      // checksummed recipient address
  tokenAddress: string   // checksummed token contract address
  chainId: number        // EVM chain ID
  amountSmallest: string // token amount in smallest unit (e.g. '1000000' for 1 USDT)
}}

// Failure
{ success: false, reason:
  | 'INVALID_FORMAT'
  | 'UNSUPPORTED_METHOD'
  | 'MISSING_REQUIRED_PARAM'
  | 'INVALID_RECIPIENT'
  | 'INVALID_AMOUNT'
}
```

### Utilities

| Function | Input | Returns |
|---|---|---|
| `resolveUmaUsername(uma)` | UMA string | `{ localPart: string, domain: string, lightningAddress: string }` or `null` |
| `stripLightningPrefix(input)` | string | Input with `lightning:` prefix removed |

## 🛠️ Development

### Testing

```bash
# Install dependencies
npm install

# Run tests
npm test
```

## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

For support, please open an issue on the GitHub repository.
