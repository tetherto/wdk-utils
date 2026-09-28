# @tetherto/wdk-utils

A collection of utilities for validating cryptocurrency addresses, passphrase-protected seed encryption, HKDF-based key derivation, Shamir secret sharing for mnemonics, and payment URIs. This package provides a set of functions to validate various address formats and parse payment requests from different blockchain networks.

## 🔍 About WDK

This module is part of [**WDK (Wallet Development Kit) by Tether**](https://wallet.tether.io/), which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control.

See the [WDK Utils documentation](https://docs.wdk.tether.io/tools/wdk-utils/). For the complete ecosystem, see the [general WDK documentation](https://docs.wdk.tether.io/).

## 🌟 Features

- **Bitcoin Address Validation**: Supports P2PKH, P2SH, and Bech32 address formats.
- **BIP-21 Payment URI Support**: Parses and encodes `bitcoin:` payment URIs including optional amount, label, and message parameters.
- **EVM Address Validation**: Validates Ethereum-like addresses, including EIP-55 checksum validation.
- **EIP-681 Payment Request Parsing**: Parses Ethereum payment request URIs for token transfers.
- **Lightning Network Validation**: Validates Lightning invoices and Lightning addresses.
- **Solana Address Validation**: Validates base58-encoded 32-byte Solana addresses, including off-curve PDAs.
- **Spark Address Validation**: Supports Spark address formats.
- **TON Address Validation**: Validates raw and user-friendly (base64/base64url) TON addresses, including CRC16-CCITT checksums.
- **UMA Address Validation**: Validates Universal Money Addresses.
- **Seed Encryption**: Encrypts and decrypts seed phrases with AES-256-GCM and scrypt key derivation.
- **Key Derivation**: HKDF-SHA256 seed derivation and deterministic ed25519 keypair generation.
- **Shamir Secret Sharing**: Splits a BIP-39 mnemonic into `n` shares, any `k` of which reconstruct it.

## ⬇️ Installation

You can install the package using npm:

```bash
npm install @tetherto/wdk-utils
```

## ⚠️ Platform Requirements

### React Native

`encrypt()` needs a cryptographically secure random source (`crypto.getRandomValues`, used internally by `@noble/ciphers`). React Native's Hermes engine doesn't provide this by default, so RN apps need a polyfill:

```bash
npm install react-native-get-random-values
```

Import it once, as the **first import** in your app's entry point — before any file that imports `@tetherto/wdk-utils`:

```javascript
// index.js / App.tsx / app/_layout.tsx — must be the first import
import 'react-native-get-random-values';
```

Without it, `encrypt()` throws with a message pointing back to this section rather than failing silently or with an opaque error.

## 🚀 Quick Start

### Importing functions

```javascript
import {
  validateAddress,
  validateBitcoinAddress,
  isBip21Request,
  parseBip21Request,
  encodeBip21Request,
  validateEVMAddress,
  isEip681Request,
  parseEip681Request,
  validateLightningInvoice,
  validateLightningAddress,
  validateSolanaAddress,
  validateSparkAddress,
  validateTonAddress,
  validateUmaAddress,
  encrypt,
  decrypt,
  deriveSeedKey,
  deriveSeedKeyPair,
  splitMnemonic,
  combineMnemonic
} from '@tetherto/wdk-utils';
```

### Usage Examples

```javascript
// Generic Address Validation (dispatches by CAIP-2 chain id)
const result = validateAddress('eip155:1', '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe')
console.log(result) // { success: true, type: 'evm' }

// Bitcoin Address Validation
const btcResult = validateBitcoinAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
console.log(btcResult) // { success: true, type: 'bech32', compatibleNetworks: ['bitcoin'] }

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

// Solana Address Validation
const solResult = validateSolanaAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
console.log(solResult) // { success: true, type: 'solana' }

// Spark Address Validation
const sparkResult = validateSparkAddress('...')
console.log(sparkResult) // { success: true, type: 'spark' | 'btc', compatibleNetworks: ['mainnet'] }

// TON Address Validation
const tonResult = validateTonAddress('EQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPrHF')
console.log(tonResult) // { success: true, type: 'ton' }

const umaResult = validateUmaAddress('$user@domain.com')
console.log(umaResult) // { success: true, type: 'uma' }

// Seed Encryption
const payload = encrypt(seedPhrase, passphrase);
const decrypted = decrypt(payload, passphrase);

// Key Derivation
const derivedKey = deriveSeedKey(seed, { salt: 'wdk-addressbook-v1', info: 'autobase-encryption' });
const { publicKey, secretKey } = deriveSeedKeyPair(seed, { salt: 'wdk-addressbook-v1', info: 'bootstrap-writer' });

// Shamir Secret Sharing — split a mnemonic into 5 shares, any 3 reconstruct it
const shares = await splitMnemonic(mnemonic, { shares: 5, threshold: 3 });
const recovered = await combineMnemonic(shares.slice(0, 3));
console.log(recovered === mnemonic); // true

```

## 📚 API Reference

### Address Validation

| Function | Input | Returns on success | Returns on failure |
|---|---|---|---|
| `validateAddress(chainId, address)` | CAIP-2 chain id (e.g. `'eip155:1'`) and address string | The chain validator's result (see rows below). For `bip122` and `spark` chain ids the reference also selects the expected network | `{ success: false, reason: string }` — `'NETWORK_MISMATCH'` when a Bitcoin or Spark address belongs to another network or the reference is missing or unknown, `'UNSUPPORTED_CHAIN'` when the chain namespace has no validator, `'INVALID_CHAIN_ID'` for a malformed chain id |
| `validateBitcoinAddress(address)` | Bitcoin address string | `{ success: true, type: 'p2pkh' \| 'p2sh' \| 'bech32' \| 'bech32m', compatibleNetworks: ('bitcoin' \| 'testnet' \| 'regtest')[] }` — legacy testnet-format addresses list both `'testnet'` and `'regtest'`, since the two networks share Base58 version bytes | `{ success: false, reason: string }` |
| `validateEVMAddress(address)` | EVM address string | `{ success: true, type: 'evm' }` | `{ success: false, reason: string }` |
| `validateLightningInvoice(invoice)` | BOLT-11 invoice string | `{ success: true, type: 'invoice' }` | `{ success: false, reason: string }` |
| `validateLightningAddress(address)` | Lightning address string | `{ success: true, type: 'address' }` | `{ success: false, reason: string }` |
| `validateSolanaAddress(address)` | Solana address string | `{ success: true, type: 'solana' }` | `{ success: false, reason: string }` |
| `validateSparkAddress(address)` | Spark address string | `{ success: true, type: 'spark' \| 'btc', compatibleNetworks: ('mainnet' \| 'testnet' \| 'regtest' \| 'signet' \| 'local')[] }` — L1 deposit addresses for testnet/signet and regtest/local share their Bitcoin formats and list both networks | `{ success: false, reason: string }` |
| `validateTonAddress(address)` | TON address string (raw `<workchain>:<hex>` or user-friendly base64/base64url) | `{ success: true, type: 'ton' }` — user-friendly addresses are verified against their CRC16-CCITT checksum | `{ success: false, reason: string }` |
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

### `encrypt(plaintext: string, password: string, scryptParams?: ScryptParams)`
Encrypts a string with AES-256-GCM using a scrypt-derived key.
- **Returns**: `{ version: 1, salt, iv, tag, ciphertext, scryptN, scryptR, scryptP }` (hex-encoded binary fields)
- **scryptParams**: Optional `{ N, r, p }`; defaults to `{ N: 65536, r: 8, p: 1 }`

### `decrypt(payload: EncryptedPayload, password: string)`
Decrypts an encrypted payload using a passphrase. Reads `scryptN` / `scryptR` / `scryptP` from the payload when present; otherwise uses defaults.
- **Returns**: `string`
- **Throws**: If the password is wrong or the payload was tampered with.

### `deriveKey(password: string, salt: Uint8Array, scryptParams?: ScryptParams)`
Derives a 32-byte AES key from a passphrase and salt using scrypt.
- **Returns**: `Uint8Array`

### `DEFAULT_SCRYPT_PARAMS`
Default scrypt cost parameters: `{ N: 65536, r: 8, p: 1 }`.

### `decryptWithKey(payload: EncryptedPayload, key: Uint8Array)`
Decrypts an encrypted payload using a pre-derived key.
- **Returns**: `string`

### `deriveSeedKey(seed: string | Uint8Array, options: SeedKeyOptions)`
Derives a key from high-entropy input using HKDF-SHA256.
- **options**: `{ salt, info, length? }` — `salt` and `info` are required domain-separation labels; `length` defaults to `32`.
- **Returns**: `Uint8Array`

### `deriveSeedKeyPair(seed: string | Uint8Array, options: SeedKeyOptions)`
Derives a deterministic ed25519 keypair from a seed. Output is byte-compatible with hypercore-crypto's `keyPair(seed)`.
- **options**: `{ salt, info }` — domain-separation labels (key length is fixed at 32 bytes).
- **Returns**: `{ publicKey: Uint8Array, secretKey: Uint8Array }` — `publicKey` is 32 bytes; `secretKey` is 64 bytes (`seed32 || publicKey`).

### `splitMnemonic(mnemonic: string, options: SplitOptions)`
Splits a BIP-39 mnemonic into hex-encoded Shamir shares. The mnemonic is decoded to its raw BIP-39 entropy (16–32 bytes) and prefixed with a 4-byte integrity checksum before splitting, so only that is shared and the phrase is re-derived on `combineMnemonic`.
- **mnemonic**: A valid BIP-39 mnemonic (12, 15, 18, 21, or 24 words). Leading/trailing/repeated whitespace is normalized; an invalid checksum, a non-wordlist word, or a bad word count is rejected here.
- **options**: `{ shares, threshold }` — `shares` is the total number of shares to create (n, `2..255`); `threshold` is the minimum needed to reconstruct (k, `2..shares`).
- **Returns**: `Promise<string[]>` — an array of `shares` hex-encoded strings (~21 bytes each for a 12-word mnemonic: 16-byte entropy + 4-byte checksum + index).

### `combineMnemonic(shares: string[])`
Reconstructs a BIP-39 mnemonic from Shamir shares. At least `threshold` shares must be supplied; share hex is case-insensitive.
- **shares**: Array of hex-encoded shares produced by `splitMnemonic` (at least 2).
- **Returns**: `Promise<string>` — the reconstructed BIP-39 mnemonic.
- **Integrity**: The embedded checksum is verified, so wrong, corrupted, or insufficient shares are rejected instead of returning an incorrect phrase. This is error detection, not authentication against maliciously crafted shares.

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
