# @tetherto/wdk-utils

A collection of utilities for validating cryptocurrency addresses. This package provides a set of functions to validate various address formats from different blockchain networks.

## 🔍 About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://wallet.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control. 

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## 🌟 Features

- **Bitcoin Address Validation**: Supports P2PKH, P2SH, and Bech32 address formats.
- **EVM Address Validation**: Validates Ethereum-like addresses, including EIP-55 checksum validation.
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
  validateEVMAddress,
  validateLightningInvoice,
  validateLightningAddress,
  validateSparkAddress,
  validateUmaAddress
} from '@tetherto/wdk-utils';
```

### Usage Examples

```javascript
// Bitcoin Address Validation
const btcResult = validateBitcoinAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
console.log('Bitcoin validation result:', btcResult);

// EVM Address Validation
const evmResult = validateEVMAddress('0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe');
console.log('EVM validation result:', evmResult);

// Lightning Invoice Validation
const lnInvoiceResult = validateLightningInvoice('lnbc...');
console.log('Lightning invoice validation result:', lnInvoiceResult);

// Lightning Address Validation
const lnAddressResult = validateLightningAddress('user@domain.com');
console.log('Lightning address validation result:', lnAddressResult);

// Spark Address Validation
const sparkResult = validateSparkAddress('...');
console.log('Spark validation result:', sparkResult);

// UMA Address Validation
const umaResult = validateUmaAddress('$user@domain.com');
console.log('UMA validation result:', umaResult);
```

## 📚 API Reference

### `validateBitcoinAddress(address: string)`
Validates a Bitcoin address.
- **Returns**: `{ success: true, type: 'p2pkh' | 'p2sh' | 'bech32' }` or `{ success: false, reason: string }`

### `validateEVMAddress(address: string)`
Validates an EVM address.
- **Returns**: `{ success: true, type: 'evm' }` or `{ success: false, reason: string }`

### `validateLightningInvoice(address: string)`
Validates a Lightning Network invoice.
- **Returns**: `{ success: true, type: 'invoice' }` or `{ success: false, reason: string }`

### `validateLightningAddress(address: string)`
Validates a Lightning Address.
- **Returns**: `{ success: true, type: 'address' }` or `{ success: false, reason: string }`

### `validateSparkAddress(address: string)`
Validates a Spark address.
- **Returns**: `{ success: true, type: 'btc' | 'alphanumeric' }` or `{ success: false, reason: string }`

### `validateUmaAddress(address: string)`
Validates a Universal Money Address.
- **Returns**: `{ success: true, type: 'uma' }` or `{ success: false, reason: string }`

### `resolveUmaUsername(uma: string)`
Resolves a UMA username to its components.
- **Returns**: `{ localPart: string; domain: string; lightningAddress: string } | null`

### `stripLightningPrefix(input: string)`
Strips the "lightning:" prefix from a string.
- **Returns**: `string`

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
