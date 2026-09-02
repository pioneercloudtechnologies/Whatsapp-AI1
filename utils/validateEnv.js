const REQUIRED_VARS = [
  "OPENAI_API_KEY",
  "WHATSAPP_TOKEN",
  "PHONE_NUMBER_ID",
  "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET",
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "ADMIN_API_KEY"
]

const validateEnv = () => {
  const missing = REQUIRED_VARS.filter(
    (name) => !process.env[name]
  )

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
      "See .env.example for the full list."
    )
    process.exit(1)
  }
}

module.exports = { validateEnv }
