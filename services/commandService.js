const {
  getMemories,
  deleteMemory,
  deleteAllMemories
} = require("./memoryService")

const { updatePersonality } = require("./settingsService")
const { clearConversationHistory } = require("./conversationService")

const HELP_TEXT =
  `Here's what I can do:\n\n` +
  `/memories - see what I remember about you\n` +
  `/forget <key> - make me forget one thing\n` +
  `/forget all - wipe everything I remember about you\n` +
  `/reset - clear our chat history (I'll keep your memories)\n` +
  `/personality <description> - tell me how to behave\n` +
  `/help - show this message`

const handleCommand = async (phone, conversationId, text) => {

  if (!text.startsWith("/")) {
    return null
  }

  const [rawCommand, ...rest] = text.trim().split(/\s+/)
  const command = rawCommand.toLowerCase()
  const argument = rest.join(" ").trim()

  if (command === "/help") {
    return HELP_TEXT
  }

  if (command === "/memories") {
    const memories = await getMemories(phone)

    if (memories.length === 0) {
      return "I don't have any memories saved about you yet."
    }

    return (
      "Here's what I remember about you:\n\n" +
      memories.map((m) => `${m.memory_key}: ${m.memory_value}`).join("\n")
    )
  }

  if (command === "/forget") {
    if (!argument) {
      return "Tell me what to forget, e.g. /forget favorite_color, or /forget all"
    }

    if (argument.toLowerCase() === "all") {
      const success = await deleteAllMemories(phone)
      return success
        ? "Done — I've forgotten everything about you."
        : "Something went wrong while forgetting that, try again in a bit."
    }

    const success = await deleteMemory(phone, argument.toLowerCase())
    return success
      ? `Done — I've forgotten "${argument}".`
      : "Something went wrong while forgetting that, try again in a bit."
  }

  if (command === "/reset") {
    const success = await clearConversationHistory(conversationId)
    return success
      ? "Fresh start! I've cleared our chat history — I still remember who you are though."
      : "Something went wrong clearing our history, try again in a bit."
  }

  if (command === "/personality") {
    if (!argument) {
      return "Tell me how you'd like me to behave, e.g. /personality sarcastic and witty"
    }

    const success = await updatePersonality(phone, argument)
    return success
      ? `Got it — I'll be "${argument}" from now on.`
      : "Something went wrong updating that, try again in a bit."
  }

  return `I don't know that command. ${HELP_TEXT}`
}

module.exports = { handleCommand }
