const supabase = require("../database/supabase")

const isDuplicateMessage = async (messageId) => {
  const { error } = await supabase
    .from("processed_messages")
    .insert([{ message_id: messageId }])

  if (!error) {
    return false
  }

  if (error.code === "23505") {
    return true
  }

  console.error("Dedupe check failed:", error.message)
  return false
}

module.exports = { isDuplicateMessage }
