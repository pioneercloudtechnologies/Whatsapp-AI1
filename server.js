require("dotenv").config()

const express = require("express")
const axios = require("axios")
const OpenAI = require("openai")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cors())

const processedMessages = new Set()
const userConversations = {}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

app.get("/", (req, res) => {
  res.send("Bot is running")
})

app.get("/webhook", (req, res) => {

  const VERIFY_TOKEN = "hello"

  const mode = req.query["hub.mode"]
  const token = req.query["hub.verify_token"]
  const challenge = req.query["hub.challenge"]

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge)
  } else {
    res.sendStatus(403)
  }

})

app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

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

    console.log("User:", userMessage)

    if (!userConversations[from]) {
  userConversations[from] = [
    {
      role: "system",
      content: "You are a friendly, natural WhatsApp friend. Talk casually, warmly, and briefly like a real friend."
    }
  ]
}

userConversations[from].push({
  role: "user",
  content: userMessage
})

const completion = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: userConversations[from]
})

const aiReply = completion.choices[0].message.content

userConversations[from].push({
  role: "assistant",
  content: aiReply
})

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
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    )

    res.sendStatus(200)

  } catch (error) {
    console.log(error.response?.data || error.message)
    res.sendStatus(500)
  }
})

const PORT = process.env.PORT || 3000
app.post("/register", async (req, res) => {
  try {
    const { name, phone } = req.body

    console.log("New user:", name, phone)

    const welcomeMessage = `Hi ${name}! Your AI WhatsApp friend is now connected 🤖 Send any message to start chatting.`

    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: phone,
        text: {
          body: welcomeMessage
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    )

    res.json({ success: true })

  } catch (error) {
    console.log(error.response?.data || error.message)
    res.status(500).json({ success: false })
  }
})
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 