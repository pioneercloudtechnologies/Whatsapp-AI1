const client = require("../services/openaiClient")

const { extractMemory } = require("../services/memoryExtractor")
const { getUserSettings } = require("../services/settingsService")
const { handleCommand } = require("../services/commandService")
const { transcribeAudio } = require("../services/mediaService")
const { isDuplicateMessage } = require("../services/dedupeService")

const {
  saveMemory,
  searchRelevantMemories
} = require("../services/memoryService")

const {
  getOrCreateConversation,
  saveMessage,
  getRecentMessages
} = require("../services/conversationService")

const {
  sendWhatsAppMessage,
  markAsReadWithTyping,
  downloadMedia
} = require("../services/whatsappService")

const UNSUPPORTED_MESSAGE =
  "I can only chat over text, voice notes 🎤, and photos 📸 right now — try one of those!"

const FAILURE_MESSAGE =
  "Oops, something went wrong on my end 😅 give it another try in a bit."

const resolveIncomingMessage = async (message) => {

  if (message.type === "text") {
    return { text: message.text.body }
  }

  if (message.type === "audio") {
    const { buffer, mimeType } = await downloadMedia(message.audio.id)
    const text = await transcribeAudio(buffer, mimeType)
    return { text }
  }

  if (message.type === "image") {
    const { buffer, mimeType } = await downloadMedia(message.image.id)
    return {
      text: message.image.caption || "",
      imageBase64: buffer.toString("base64"),
      imageMimeType: mimeType
    }
  }

  return null
}

const processMessage = async (message) => {

  const from = message.from

  await markAsReadWithTyping(message.id)

  const conversation = await getOrCreateConversation(from)

  if (!conversation) {
    console.error("Could not find or create conversation for", from)
    return
  }

  const resolved = await resolveIncomingMessage(message)

  if (!resolved) {
    await sendWhatsAppMessage(from, UNSUPPORTED_MESSAGE)
    return
  }

  const userMessage = resolved.text?.trim() || ""

  if (userMessage.startsWith("/")) {
    const reply = await handleCommand(from, conversation.id, userMessage)
    if (reply) {
      await sendWhatsAppMessage(from, reply)
      return
    }
  }

  // -----------------------------
  // MEMORY EXTRACTION
  // -----------------------------

  if (userMessage) {
    try {
      const extracted = await extractMemory(userMessage)

      if (extracted.memories && Array.isArray(extracted.memories)) {
        for (const memory of extracted.memories) {
          await saveMemory(from, memory.key, memory.value)
        }
      }
    } catch (error) {
      console.error("Memory extraction failed:", error.message)
    }
  }

  // -----------------------------
  // SETTINGS + RELEVANT MEMORIES
  // -----------------------------

  const settings = await getUserSettings(from)

  const memories = userMessage
    ? await searchRelevantMemories(from, userMessage)
    : []

  const memoryContext = memories
    .map((memory) => `${memory.memory_key}: ${memory.memory_value}`)
    .join("\n")

  // -----------------------------
  // CONVERSATION HISTORY
  // -----------------------------

  const recentMessages = await getRecentMessages(conversation.id)

  const historyLabel = resolved.imageBase64
    ? `[image] ${userMessage}`.trim()
    : userMessage

  await saveMessage(conversation.id, "user", historyLabel)

  const userContent = resolved.imageBase64
    ? [
        { type: "text", text: userMessage || "What do you think of this?" },
        {
          type: "image_url",
          image_url: {
            url: `data:${resolved.imageMimeType};base64,${resolved.imageBase64}`
          }
        }
      ]
    : userMessage

  // -----------------------------
  // GPT
  // -----------------------------

  const completion = await client.chat.completions.create({

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
        content: userContent
      }

    ]

  })

  const aiReply = completion.choices[0].message.content

  await saveMessage(conversation.id, "assistant", aiReply)

  // -----------------------------
  // SEND WHATSAPP MESSAGE
  // -----------------------------

  await sendWhatsAppMessage(from, aiReply)
}

const handleWebhookMessage = async (req, res) => {

  const message =
    req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

  if (!message) {
    return res.sendStatus(200)
  }

  const duplicate = await isDuplicateMessage(message.id)

  if (duplicate) {
    return res.sendStatus(200)
  }

  // Ack WhatsApp immediately — the pipeline below can take several
  // seconds (LLM calls, embeddings, media downloads) and WhatsApp
  // retries the webhook if it doesn't get a fast response.
  res.sendStatus(200)

  processMessage(message).catch(async (error) => {

    console.error(
      "Failed to process message:",
      error.response?.data || error.message
    )

    try {
      await sendWhatsAppMessage(message.from, FAILURE_MESSAGE)
    } catch (sendError) {
      console.error(
        "Failed to send failure notice:",
        sendError.response?.data || sendError.message
      )
    }

  })

}

module.exports = {
  handleWebhookMessage
}
