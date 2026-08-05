const axios = require("axios")
const OpenAI = require("openai")

const {
  shouldExtractMemory
} = require("../services/memoryClassifier")

const {
  extractMemory
} = require("../services/memoryExtractor")

const {
  getUserSettings
} = require("../services/settingsService")

const {
  saveMemory,
  searchRelevantMemories
} = require("../services/memoryService")

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

    // -----------------------------
    // MEMORY CLASSIFIER
    // -----------------------------

    const decision =
      await shouldExtractMemory(userMessage)

    console.log(
      "Memory decision:",
      decision
    )

    if (decision.save) {

      const extractedMemory =
        await extractMemory(userMessage)

      console.log(
        "Extracted memories:",
        extractedMemory
      )

      if (
        extractedMemory.memories &&
        Array.isArray(extractedMemory.memories)
      ) {

        for (const memory of extractedMemory.memories) {

          await saveMemory(
            from,
            memory.key,
            memory.value
          )

          console.log(
            "Auto memory saved:",
            memory.key,
            memory.value
          )

        }

      }

    } else {

      console.log(
        "Memory ignored."
      )

    }

    // -----------------------------
    // SETTINGS
    // -----------------------------

    const settings =
      await getUserSettings(from)

    // -----------------------------
    // SEMANTIC MEMORY SEARCH
    // -----------------------------

    const memories =
      await searchRelevantMemories(
        from,
        userMessage
      )

    const memoryContext =
      memories
        .map(memory =>
          `${memory.memory_key}: ${memory.memory_value}`
        )
        .join("\n")

    console.log(
      "Relevant memories:",
      memories.length
    )

    // -----------------------------
    // CONVERSATION
    // -----------------------------

    const conversation =
      await getOrCreateConversation(from)

    console.log(
      "Conversation:",
      conversation
    )

    if (!conversation) {

      console.log(
        "Conversation is null"
      )

      return res.sendStatus(500)

    }

    const recentMessages =
      await getRecentMessages(
        conversation.id
      )

    await saveMessage(
      conversation.id,
      "user",
      userMessage
    )

    console.log(
      "User:",
      userMessage
    )

    // -----------------------------
    // GPT
    // -----------------------------

    const completion =
      await client.chat.completions.create({

        model: "gpt-4o-mini",

        messages: [

          {
            role: "system",

            content: `You are a friendly WhatsApp AI assistant.

Personality:
${settings.personality}

Tone:
${settings.tone}

Creativity:
${settings.creativity}

Relevant user memories:
${memoryContext}

Use the memories naturally.
Do not mention them unless they help answer the user's message.
Talk casually and naturally like a real friend.`
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

    // -----------------------------
    // SEND WHATSAPP MESSAGE
    // -----------------------------

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
          "Content-Type":
            "application/json"
        }
      }

    )

    res.sendStatus(200)

  } catch (error) {

    console.log(
      error.response?.data ||
      error.message
    )

    res.sendStatus(500)

  }

}

module.exports = {
  handleWebhookMessage
}