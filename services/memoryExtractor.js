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

Extract ONLY long-term personal information.

Examples:
- name
- age
- city
- country
- interests
- hobbies
- favorite things
- goals
- job
- language

DO NOT save:
- questions
- temporary requests
- greetings
- random conversation

Examples:

"My name is Mazen"
→ {
  "should_save": true,
  "key": "name",
  "value": "Mazen"
}

"I live in Jeddah"
→ {
  "should_save": true,
  "key": "city",
  "value": "Jeddah"
}

"What is my name?"
→ {
  "should_save": false,
  "key": "",
  "value": ""
}

Return ONLY valid JSON.
`
}

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