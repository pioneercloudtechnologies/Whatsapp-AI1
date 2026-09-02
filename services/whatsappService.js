const axios = require("axios")
const { chunkText } = require("../utils/textUtils")

const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0"

const client = axios.create({
  baseURL: `https://graph.facebook.com/${API_VERSION}/${process.env.PHONE_NUMBER_ID}`,
  headers: {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    "Content-Type": "application/json"
  }
})

const sendWhatsAppMessage = async (to, text) => {
  const chunks = chunkText(text)

  for (const chunk of chunks) {
    await client.post("/messages", {
      messaging_product: "whatsapp",
      to,
      text: { body: chunk }
    })
  }
}

const markAsReadWithTyping = async (messageId) => {
  try {
    await client.post("/messages", {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
      typing_indicator: { type: "text" }
    })
  } catch (error) {
    console.error(
      "Failed to send read receipt/typing indicator:",
      error.response?.data || error.message
    )
  }
}

const sendTemplateMessage = async (to, templateName, languageCode = "en_US", components = []) => {
  await client.post("/messages", {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components
    }
  })
}

const downloadMedia = async (mediaId) => {
  const metaResponse = await axios.get(
    `https://graph.facebook.com/${API_VERSION}/${mediaId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
      }
    }
  )

  const mediaResponse = await axios.get(metaResponse.data.url, {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
    },
    responseType: "arraybuffer"
  })

  return {
    buffer: Buffer.from(mediaResponse.data),
    mimeType: metaResponse.data.mime_type
  }
}

module.exports = {
  sendWhatsAppMessage,
  markAsReadWithTyping,
  sendTemplateMessage,
  downloadMedia
}
