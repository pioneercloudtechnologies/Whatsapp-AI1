const client = require("./openaiClient")
const { toFile } = require("openai")

const transcribeAudio = async (buffer, mimeType) => {
  const extension = mimeType?.includes("ogg") ? "ogg" : "mp3"

  const file = await toFile(buffer, `voice-note.${extension}`)

  const response = await client.audio.transcriptions.create({
    file,
    model: "whisper-1"
  })

  return response.text
}

module.exports = { transcribeAudio }
