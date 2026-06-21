import { bytesToHex } from '@noble/hashes/utils.js'

const { deriveSeedKey, deriveSeedKeyPair } = await import('../src/key-derivation/index.js')

const SEED = new Uint8Array(64).fill(0xab)
const SALT = 'wdk-addressbook-v1'

describe('key-derivation', () => {
  it('throws when salt is missing', () => {
    expect(() => deriveSeedKey(SEED, { info: 'test' })).toThrow('salt is required')
  })

  it('throws when info is missing', () => {
    expect(() => deriveSeedKey(SEED, { salt: SALT })).toThrow('info is required')
  })

  it('derives deterministically for the same inputs', () => {
    const opts = { salt: SALT, info: 'autobase-encryption' }
    const a = deriveSeedKey(SEED, opts)
    const b = deriveSeedKey(SEED, opts)
    expect(bytesToHex(a)).toBe(bytesToHex(b))
  })

  it('domain-separates by info', () => {
    const a = deriveSeedKey(SEED, { salt: SALT, info: 'autobase-encryption' })
    const b = deriveSeedKey(SEED, { salt: SALT, info: 'bootstrap-writer' })
    expect(bytesToHex(a)).not.toBe(bytesToHex(b))
  })

  it('domain-separates by salt', () => {
    const a = deriveSeedKey(SEED, { salt: SALT, info: 'autobase-encryption' })
    const b = deriveSeedKey(SEED, { salt: 'other-salt', info: 'autobase-encryption' })
    expect(bytesToHex(a)).not.toBe(bytesToHex(b))
  })

  it('supports length override', () => {
    const key = deriveSeedKey(SEED, { salt: SALT, info: 'autobase-encryption', length: 64 })
    expect(key).toHaveLength(64)
  })

  it('derives keypair with expected shape', () => {
    const opts = { salt: SALT, info: 'autobase-encryption' }
    const { publicKey, secretKey } = deriveSeedKeyPair(SEED, opts)
    const seed32 = deriveSeedKey(SEED, { ...opts, length: 32 })

    expect(publicKey).toHaveLength(32)
    expect(secretKey).toHaveLength(64)
    expect(bytesToHex(secretKey)).toBe(bytesToHex(seed32) + bytesToHex(publicKey))
  })

  describe('pinned vectors (hypercore-crypto compatible)', () => {
    it('autobase-encryption', () => {
      const opts = { salt: SALT, info: 'autobase-encryption' }
      const key = deriveSeedKey(SEED, opts)
      const { publicKey, secretKey } = deriveSeedKeyPair(SEED, opts)

      expect(bytesToHex(key)).toBe('a74871bd671a7ad043896a434984ded12b6d35b5d81d30e6986d69bd7ff1b2a6')
      expect(bytesToHex(publicKey)).toBe('1549ef9e76b5335aeca96c3a7828ebe8471d836d35ebe4f1d82774fee519a4f9')
      expect(bytesToHex(secretKey)).toBe(
        'a74871bd671a7ad043896a434984ded12b6d35b5d81d30e6986d69bd7ff1b2a61549ef9e76b5335aeca96c3a7828ebe8471d836d35ebe4f1d82774fee519a4f9'
      )
    })

    it('bootstrap-writer', () => {
      const opts = { salt: SALT, info: 'bootstrap-writer' }
      const key = deriveSeedKey(SEED, opts)
      const { publicKey, secretKey } = deriveSeedKeyPair(SEED, opts)

      expect(bytesToHex(key)).toBe('465b4ff2db1c80d0ca6b1d3645400e4e175aba3bc49978c67ef17b902cc30b2d')
      expect(bytesToHex(publicKey)).toBe('a1ad67871ec9e886efa683586509916cea363082bd6135b3b2f8585b7040d515')
      expect(bytesToHex(secretKey)).toBe(
        '465b4ff2db1c80d0ca6b1d3645400e4e175aba3bc49978c67ef17b902cc30b2da1ad67871ec9e886efa683586509916cea363082bd6135b3b2f8585b7040d515'
      )
    })
  })
})
