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
      return res.status(500).json(error)
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
      return res.status(500).json(error)
    }

    res.json(data)
}

module.exports = {
  getUserConversations,
  getConversationMessages
}