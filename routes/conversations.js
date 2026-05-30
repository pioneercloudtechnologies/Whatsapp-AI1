const express = require("express")

const {
  getUserConversations,
  getConversationMessages
} = require("../controllers/conversationController")

const router = express.Router()

router.get(
  "/conversations/:phone",
  getUserConversations
)

router.get(
  "/messages/:conversationId",
  getConversationMessages
)

module.exports = router