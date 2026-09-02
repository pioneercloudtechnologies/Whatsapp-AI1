const crypto = require("crypto")

const verifyWhatsAppSignature = (req, res, next) => {
  const signatureHeader = req.headers["x-hub-signature-256"]

  if (!signatureHeader || !req.rawBody) {
    return res.sendStatus(401)
  }

  const expectedSignature =
    "sha256=" +
    crypto
      .createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
      .update(req.rawBody)
      .digest("hex")

  const signatureBuffer = Buffer.from(signatureHeader)
  const expectedBuffer = Buffer.from(expectedSignature)

  const isValid =
    signatureBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(signatureBuffer, expectedBuffer)

  if (!isValid) {
    return res.sendStatus(401)
  }

  next()
}

module.exports = { verifyWhatsAppSignature }
