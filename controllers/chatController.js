const axios = require("axios")
const OpenAI = require("openai")

const {
  getOrCreateConversation,
  saveMessage,
  getRecentMessages
} = require("../services/conversationService")

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const processedMessages = new Set()

const handleWebhookMessage = async (req, res) => {

  try {

    const message =
      req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

    if (!message || message.type !== "text") {
      return res.sendStatus(200)
    }

    const messageId = message.id

    if (processedMessages.has(messageId)) {
      return res.sendStatus(200)
    }

    processedMessages.add(messageId)

    const userMessage = message.text.body
    const from = message.from

    const conversation =
      await getOrCreateConversation(from)

    const recentMessages =
      await getRecentMessages(conversation.id)

    await saveMessage(
      conversation.id,
      "user",
      userMessage
    )

    console.log("User:", userMessage)

    

    const completion =
      await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
           role: "system",
           content:
             "You are a friendly, natural WhatsApp friend. Talk casually, warmly, and briefly like a real friend."
          },
          ...recentMessages,
          {
           role: "user",
           content: userMessage
          }
        ]
      })

    const aiReply =
      completion.choices[0].message.content

    await saveMessage(
      conversation.id,
      "assistant",
      aiReply
    )



    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: {
          body: aiReply
        }
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    )

    res.sendStatus(200)

  } catch (error) {

    console.log(
      error.response?.data || error.message
    )

    res.sendStatus(500)
  }
}

module.exports = {
  handleWebhookMessage
}