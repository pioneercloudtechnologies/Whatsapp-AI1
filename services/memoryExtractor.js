const OpenAI = require("openai")

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const extractMemory = async (message) => {

  const completion =
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: {
        type: "json_object"
      },
      messages: [
        {
          role: "system",
          content: `
Extract important user facts.

Return JSON:

{
  "should_save": true or false,
  "key": "",
  "value": ""
}
`
        },
        {
          role: "user",
          content: message
        }
      ]
    })

  return JSON.parse(
    completion.choices[0].message.content
  )
}

module.exports = {
  extractMemory
}