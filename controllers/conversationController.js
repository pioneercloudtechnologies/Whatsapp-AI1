const supabase = require("../database/supabase")

const getUserConversations =
  async (req, res) => {

    const phone = req.params.phone

    const { data, error } =
      await supabase
        .from("conversations")
        .select("*")
        .eq("user_phone", phone)
        .order("created_at", {
          ascending: false
        })

    if (error) {
      console.error("Failed to fetch conversations:", error.message)
      return res.status(500).json({ error: "Failed to fetch conversations" })
    }

    res.json(data)
}

const getConversationMessages =
  async (req, res) => {

    const conversationId =
      req.params.conversationId

    const { data, error } =
      await supabase
        .from("messages")
        .select("*")
        .eq(
          "conversation_id",
          conversationId
        )
        .order("created_at", {
          ascending: true
        })

    if (error) {
      console.error("Failed to fetch messages:", error.message)
      return res.status(500).json({ error: "Failed to fetch messages" })
    }

    res.json(data)
}

module.exports = {
  getUserConversations,
  getConversationMessages
}
