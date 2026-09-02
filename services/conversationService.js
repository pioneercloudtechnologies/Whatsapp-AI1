const supabase = require("../database/supabase")

const getOrCreateConversation = async (phone) => {

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_phone", phone)
    .maybeSingle()

  if (conversation) {
    return conversation
  }

  const {
    data: newConversation,
    error: insertError
  } = await supabase
    .from("conversations")
    .insert([
      {
        user_phone: phone
      }
    ])
    .select()
    .single()

  if (!insertError) {
    return newConversation
  }

  if (insertError.code === "23505") {
    const { data: existing } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_phone", phone)
      .maybeSingle()

    return existing
  }

  console.error("Failed to create conversation:", insertError.message)
  return null
}

const saveMessage = async (
  conversationId,
  role,
  content
) => {

  const { error } =
    await supabase
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          role,
          content
        }
      ])

  if (error) {
    console.error("Failed to save message:", error.message)
  }
}

const getRecentMessages = async (
  conversationId
) => {

  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", {
      ascending: true
    })
    .limit(20)

  if (error) {
    console.error("Failed to fetch recent messages:", error.message)
    return []
  }

  return data
}

const clearConversationHistory = async (conversationId) => {
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId)

  if (error) {
    console.error("Failed to clear conversation history:", error.message)
    return false
  }

  return true
}

module.exports = {
  getOrCreateConversation,
  saveMessage,
  getRecentMessages,
  clearConversationHistory
}
