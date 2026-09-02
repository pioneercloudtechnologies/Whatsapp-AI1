const express = require("express")

const {
  getUserConversations,
  getConversationMessages
} = require("../controllers/conversationController")

const { requireApiKey } = require("../middleware/auth")
const { adminLimiter } = require("../middleware/rateLimiter")

const router = express.Router()

router.use(adminLimiter, requireApiKey)

router.get(
  "/conversations/:phone",
  getUserConversations
)

router.get(
  "/messages/:conversationId",
  getConversationMessages
)

module.exports = router
