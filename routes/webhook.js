const express = require("express")
const router = express.Router()

const { handleWebhookMessage } = require("../controllers/chatController")
const { verifyWhatsAppSignature } = require("../middleware/verifyWhatsAppSignature")
const { webhookLimiter } = require("../middleware/rateLimiter")

router.get("/webhook", (req, res) => {

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN

  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }

})

router.post(
  "/webhook",
  webhookLimiter,
  verifyWhatsAppSignature,
  handleWebhookMessage
)

module.exports = router
