// Sends a proactive "check in" message to users who haven't chatted
// recently. Meant to be triggered by an external scheduler (cron,
// GitHub Actions scheduled workflow, Railway/Render cron job, etc.) —
// run `node scripts/sendCheckIns.js` on whatever cadence you like.
//
// Requires a pre-approved WhatsApp message template: WhatsApp only allows
// businesses to message a user outside a 24h reply window using a template
// that Meta has reviewed and approved. See the setup notes at the bottom
// of this file.

require("dotenv").config()

const supabase = require("../database/supabase")
const { sendTemplateMessage } = require("../services/whatsappService")

const INACTIVITY_DAYS = Number(process.env.CHECK_IN_INACTIVITY_DAYS || 3)
const TEMPLATE_NAME = process.env.CHECK_IN_TEMPLATE_NAME

const run = async () => {

  if (!TEMPLATE_NAME) {
    console.error(
      "CHECK_IN_TEMPLATE_NAME is not set. Create and get approval for a " +
      "WhatsApp message template first — see the notes at the bottom of " +
      "scripts/sendCheckIns.js."
    )
    process.exit(1)
  }

  const cutoff = new Date(
    Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, user_phone")

  if (error) {
    console.error("Failed to load conversations:", error.message)
    process.exit(1)
  }

  for (const conversation of conversations) {

    const { data: lastMessage } = await supabase
      .from("messages")
      .select("created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const isInactive = !lastMessage || lastMessage.created_at < cutoff

    if (!isInactive) {
      continue
    }

    try {
      await sendTemplateMessage(conversation.user_phone, TEMPLATE_NAME)
      console.log(`Sent check-in to ${conversation.user_phone}`)
    } catch (sendError) {
      console.error(
        `Failed to send check-in to ${conversation.user_phone}:`,
        sendError.response?.data || sendError.message
      )
    }
  }
}

run()

// -----------------------------------------------------------------------
// Setup (one-time, in Meta):
//
// 1. Go to Meta Business Manager -> WhatsApp Manager -> Message templates.
// 2. Create a template, e.g. name "check_in", category "Utility" or
//    "Marketing", body something like:
//      "Hey {{1}}! Haven't heard from you in a bit — how's it going? 👋"
// 3. Submit for review. Approval usually takes minutes to ~1 day.
// 4. Once APPROVED, set in .env:
//      CHECK_IN_TEMPLATE_NAME=check_in
//      CHECK_IN_INACTIVITY_DAYS=3   (optional, defaults to 3)
// 5. Point an external scheduler at `node scripts/sendCheckIns.js`.
// -----------------------------------------------------------------------
