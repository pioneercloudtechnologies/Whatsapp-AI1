require("dotenv").config()

const express = require("express")
const axios = require("axios")
const OpenAI = require("openai")
const cors = require("cors")
const supabase = require("./database/supabase")
const webhookRoutes = require("./routes/webhook")

const app = express()

app.use(express.json())
app.use(cors())
app.use("/", webhookRoutes)

const processedMessages = new Set()
const userConversations = {}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})


app.get("/", (req, res) => {
  res.send("Bot is running")
})



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

if (userConversations[from].length > 12) {
  userConversations[from] = [
    userConversations[from][0],
    ...userConversations[from].slice(-10)
  ]
}

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
    const { name, email, phone } = req.body

    console.log("New user:", name, phone)

    const { data, error } = await supabase.from("users").insert([
  {
    name: name,
    email: email,
    phone: phone
  }
])

console.log("Supabase result:", data)
console.log("Supabase error:", error)

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