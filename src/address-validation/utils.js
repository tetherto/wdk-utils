/**
 * Strips "lightning:" URI prefix (case-insensitive). The input is trimmed first.
 *
 * @param {string} input
 * @returns {string} Returns a string. Returns an empty string if input is not a string.
 */
export function stripLightningPrefix (input) {
  if (typeof input !== 'string') {
    return ''
  }

  const trimmed = input.trim()
  if (trimmed.toLowerCase().startsWith('lightning:')) {
    return trimmed.slice(10).trim()
  }

  return trimmed
}
