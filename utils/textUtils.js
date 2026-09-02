const WHATSAPP_TEXT_LIMIT = 4096

const chunkText = (text, limit = WHATSAPP_TEXT_LIMIT) => {
  if (text.length <= limit) {
    return [text]
  }

  const chunks = []
  let remaining = text

  while (remaining.length > limit) {
    let splitAt = remaining.lastIndexOf("\n", limit)
    if (splitAt < limit * 0.5) {
      splitAt = remaining.lastIndexOf(" ", limit)
    }
    if (splitAt < limit * 0.5) {
      splitAt = limit
    }

    chunks.push(remaining.slice(0, splitAt).trim())
    remaining = remaining.slice(splitAt).trim()
  }

  if (remaining.length > 0) {
    chunks.push(remaining)
  }

  return chunks
}

const isValidPhone = (phone) =>
  typeof phone === "string" && /^\d{7,15}$/.test(phone)

module.exports = { chunkText, isValidPhone, WHATSAPP_TEXT_LIMIT }
