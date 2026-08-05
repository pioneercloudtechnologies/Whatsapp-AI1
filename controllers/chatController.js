const axios = require("axios")
const OpenAI = require("openai")

const {
  shouldExtractMemory
} = require("../services/memoryClassifier")

const {
  getUserSettings
} = require("../services/settingsService")

const {
  saveMemory,
  getMemories,
  searchRelevantMemories
} = require("../services/memoryService")

const {
  extractMemory
} = require("../services/memoryExtractor")

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


if (
  extractedMemory.memories &&
  Array.isArray(extractedMemory.memories)
) {

  const decision =
  await shouldExtractMemory(userMessage)

console.log("Memory decision:", decision)

if (decision.save) {

 const decision =
  await shouldExtractMemory(userMessage)

console.log("Memory decision:", decision)

if (decision.save) {

  const extractedMemory =
    await extractMemory(userMessage)

  console.log(
    "Extracted memories:",
    extractedMemory
  )

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

} else {

  console.log(
    "Memory ignored."
  )

}

} else {

  console.log(
    "Memory ignored."
  )

}

}

  

    const settings =
      await getUserSettings(from)

    const memories =
  await searchRelevantMemories(
    from,
    userMessage
  )

      const memoryContext =
        memories.map(memory =>
          `${memory.memory_key}: ${memory.memory_value}`
        ).join("\n")

    const conversation =
      await getOrCreateConversation(from)

    console.log("Conversation:", conversation)

    if (!conversation) {
      console.log("Conversation is null")
      return res.sendStatus(500)
    }

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
            content: `You are a WhatsApp AI friend.

          Personality:
          ${settings.personality}

          Tone:
          ${settings.tone}

          Creativity:
          ${settings.creativity}

          User memories:
          ${memoryContext}

          Talk casually, warmly, and naturally.`
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