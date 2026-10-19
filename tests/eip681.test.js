import {
  isEip681Request,
  parseEip681Request
} from '../src/eip681/index.js'

describe('eip681', () => {
  const validRequest =
    'pol:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@137/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=0.175309000e6'

  describe('isEip681Request', () => {
    it('returns true for a request-shaped eip681 string', () => {
      expect(isEip681Request(validRequest)).toBe(true)
    })

    it('returns true for supported schemes', () => {
      expect(
        isEip681Request(
          'ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=100'
        )
      ).toBe(true)
    })

    it('returns false for unsupported scheme', () => {
      expect(
        isEip681Request(
          'solana:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=100'
        )
      ).toBe(false)
    })

    it('returns false for non-string or empty input', () => {
      expect(isEip681Request('')).toBe(false)
      expect(isEip681Request('  ')).toBe(false)
      expect(isEip681Request(null)).toBe(false)
      expect(isEip681Request(undefined)).toBe(false)
    })
  })

  describe('parseEip681Request', () => {
    it('parses a valid transfer request', () => {
      expect(parseEip681Request(validRequest)).toEqual({
        success: true,
        type: 'eip681-transfer',
        value: {
          recipient: '0xA9e338082A061d657014c08e652D96B38639F22a',
          tokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          chainId: 137,
          amountSmallest: '175309'
        }
      })
    })

    it.each([
      ['uint256 with a non-zero value', 'ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1&value=1000000000000000000'],
      ['value with a non-zero uint256', 'ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&value=1000000000000000000&uint256=1'],
      ['uint256 twice', 'ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1&uint256=1000000'],
      ['uint256 twice, once percent-encoded', 'ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1&uint%32%35%36=2'],
      ['address twice', 'ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1&address=0xc2132D05D31c914a87C6611C10748AEb04B58e8F']
    ])('returns DUPLICATE_PARAM for %s', (_, uri) => {
      expect(parseEip681Request(uri)).toEqual({ success: false, reason: 'DUPLICATE_PARAM' })
    })

    it('accepts uint256 together with a zero value', () => {
      expect(parseEip681Request('ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1000000&value=0')).toEqual({
        success: true,
        type: 'eip681-transfer',
        value: {
          recipient: '0xA9e338082A061d657014c08e652D96B38639F22a',
          tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          chainId: 1,
          amountSmallest: '1000000'
        }
      })
    })

    it('returns INVALID_TOKEN_ADDRESS for a token address with a wrong EIP-55 checksum', () => {
      expect(
        parseEip681Request('ethereum:0xdAC17F958D2ee523a2206206994597C13D831eC7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1')
      ).toEqual({ success: false, reason: 'INVALID_TOKEN_ADDRESS' })
    })

    it.each([
      ['the largest uint256', '115792089237316195423570985008687907853269984665640564039457584007913129639935', '115792089237316195423570985008687907853269984665640564039457584007913129639935'],
      ['zero in scientific notation', '0e99999999', '0']
    ])('accepts %s as amount', (_, amount, expected) => {
      expect(parseEip681Request(`ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=${amount}`)).toEqual({
        success: true,
        type: 'eip681-transfer',
        value: {
          recipient: '0xA9e338082A061d657014c08e652D96B38639F22a',
          tokenAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          chainId: 1,
          amountSmallest: expected
        }
      })
    })

    it.each([
      ['one above uint256', '115792089237316195423570985008687907853269984665640564039457584007913129639936'],
      ['1e78', '1e78'],
      ['1.5e78', '1.5e78'],
      ['1e400', '1e400'],
      ['1e99999999', '1e99999999']
    ])('returns INVALID_AMOUNT for %s', (_, amount) => {
      expect(parseEip681Request(`ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=${amount}`)).toEqual({ success: false, reason: 'INVALID_AMOUNT' })
    })

    it('accepts value as amount alias', () => {
      expect(
        parseEip681Request(
          'polygon:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@137/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&value=1000000'
        )
      ).toEqual({
        success: true,
        type: 'eip681-transfer',
        value: {
          recipient: '0xA9e338082A061d657014c08e652D96B38639F22a',
          tokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          chainId: 137,
          amountSmallest: '1000000'
        }
      })
    })

    it('returns INVALID_FORMAT for unencoded Unicode in the query', () => {
      expect(
        parseEip681Request(`${validRequest}&note=Caf\u00e9`)
      ).toEqual({ success: false, reason: 'INVALID_FORMAT' })
    })

    it('accepts percent-encoded Unicode in the query', () => {
      expect(
        parseEip681Request(`${validRequest}&note=Caf%C3%A9`)
      ).toEqual({
        success: true,
        type: 'eip681-transfer',
        value: {
          recipient: '0xA9e338082A061d657014c08e652D96B38639F22a',
          tokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          chainId: 137,
          amountSmallest: '175309'
        }
      })
    })

    it('supports scientific notation with plus exponent', () => {
      expect(
        parseEip681Request(
          'ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1e+6'
        )
      ).toEqual({
        success: true,
        type: 'eip681-transfer',
        value: {
          recipient: '0xA9e338082A061d657014c08e652D96B38639F22a',
          tokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          chainId: 1,
          amountSmallest: '1000000'
        }
      })
    })

    it('accepts token address without 0x prefix', () => {
      expect(
        parseEip681Request(
          'ethereum:c2132D05D31c914a87C6611C10748AEb04B58e8F@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1'
        )
      ).toEqual({
        success: true,
        type: 'eip681-transfer',
        value: {
          recipient: '0xA9e338082A061d657014c08e652D96B38639F22a',
          tokenAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
          chainId: 1,
          amountSmallest: '1'
        }
      })
    })

    it('returns UNSUPPORTED_METHOD for non-transfer methods', () => {
      expect(
        parseEip681Request(
          'ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@1/approve?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1'
        )
      ).toEqual({
        success: false,
        reason: 'UNSUPPORTED_METHOD'
      })
    })

    it('returns MISSING_REQUIRED_PARAM when recipient or amount is missing', () => {
      expect(
        parseEip681Request(
          'ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@1/transfer?uint256=1'
        )
      ).toEqual({
        success: false,
        reason: 'MISSING_REQUIRED_PARAM'
      })
      expect(
        parseEip681Request(
          'ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a'
        )
      ).toEqual({
        success: false,
        reason: 'MISSING_REQUIRED_PARAM'
      })
    })

    it('returns INVALID_RECIPIENT for invalid recipient address', () => {
      expect(
        parseEip681Request(
          'ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@1/transfer?address=0x123&uint256=1'
        )
      ).toEqual({
        success: false,
        reason: 'INVALID_RECIPIENT'
      })
    })

    it('returns INVALID_AMOUNT for non-integer amount after scientific expansion', () => {
      expect(
        parseEip681Request(
          'ethereum:0xc2132D05D31c914a87C6611C10748AEb04B58e8F@1/transfer?address=0xA9e338082A061d657014c08e652D96B38639F22a&uint256=1.2e-1'
        )
      ).toEqual({
        success: false,
        reason: 'INVALID_AMOUNT'
      })
    })

    it('returns INVALID_FORMAT for malformed input', () => {
      expect(parseEip681Request('hello world')).toEqual({
        success: false,
        reason: 'INVALID_FORMAT'
      })
      expect(parseEip681Request(null)).toEqual({
        success: false,
        reason: 'INVALID_FORMAT'
      })
    })
  })
})
