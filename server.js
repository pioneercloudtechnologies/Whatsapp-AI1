require("dotenv").config()

const { validateEnv } = require("./utils/validateEnv")
validateEnv()

const express = require("express")
const cors = require("cors")
const helmet = require("helmet")

const supabase = require("./database/supabase")
const { sendWhatsAppMessage } = require("./services/whatsappService")
const { isValidPhone } = require("./utils/textUtils")
const { registerLimiter } = require("./middleware/rateLimiter")

const webhookRoutes = require("./routes/webhook")
const conversationRoutes = require("./routes/conversations")

const app = express()

app.use(helmet())

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : null

if (!allowedOrigins) {
  console.warn(
    "ALLOWED_ORIGINS is not set — CORS is allowing all origins. Set it in .env for production."
  )
}

app.use(
  cors(
    allowedOrigins
      ? { origin: allowedOrigins }
      : undefined
  )
)

app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf
    }
  })
)

app.use("/", conversationRoutes)
app.use("/", webhookRoutes)

app.get("/", (req, res) => {
  res.send("Bot is running")
})

app.post("/register", registerLimiter, async (req, res) => {
  try {
    const { name, email, phone } = req.body

    if (!name || typeof name !== "string" || !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: "A valid name and phone number are required."
      })
    }

    const { error } = await supabase.from("users").insert([
      { name, email, phone }
    ])

    if (error) {
      console.error("Failed to register user:", error.message)
      return res.status(500).json({ success: false })
    }

    const welcomeMessage = `Hi ${name}! Your AI WhatsApp friend is now connected 🤖 Send any message to start chatting.`

    await sendWhatsAppMessage(phone, welcomeMessage)

    res.json({ success: true })

  } catch (error) {
    console.error(
      "Registration error:",
      error.response?.data || error.message
    )
    res.status(500).json({ success: false })
  }
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
