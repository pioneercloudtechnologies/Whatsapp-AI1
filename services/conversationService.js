const supabase = require("../database/supabase")

const getOrCreateConversation = async (phone) => {

  let { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("user_phone", phone)
    .single()

  if (!conversation) {

    const { data: newConversation } =
      await supabase
        .from("conversations")
        .insert([
          {
            user_phone: phone
          }
        ])
        .select()
        .single()

    conversation = newConversation
  }

  return conversation
}

const saveMessage = async (
  conversationId,
  role,
  content
) => {

  await supabase
    .from("messages")
    .insert([
      {
        conversation_id: conversationId,
        role,
        content
      }
    ])
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
    console.log(error)
    return []
  }

  return data
}

module.exports = {
  getOrCreateConversation,
  saveMessage,
  getRecentMessages
}