const crypto = require("crypto")

const requireApiKey = (req, res, next) => {
  const provided = req.headers["x-api-key"] || ""
  const expected = process.env.ADMIN_API_KEY || ""

  const providedBuffer = Buffer.from(provided)
  const expectedBuffer = Buffer.from(expected)

  const isValid =
    expected.length > 0 &&
    providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer)

  if (!isValid) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  next()
}

module.exports = { requireApiKey }
