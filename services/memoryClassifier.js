const OpenAI = require("openai")

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

const shouldExtractMemory = async (message) => {

  const completion =
    await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are an AI that decides whether a user's message contains NEW long-term personal information.

Only answer with valid JSON.

Return:

{
  "save": true
}

or

{
  "save": false
}

Save ONLY if the message introduces or updates facts about the user such as:

- name
- age
- birthday
- city
- country
- education
- job
- hobbies
- interests
- goals
- dreams
- favorite things
- dislikes
- pets
- family
- long-term preferences

DO NOT save:

- greetings
- jokes
- questions
- opinions about today's conversation
- temporary plans
- shopping requests
- clothing colors
- food being eaten today
- emotions
- random conversation

Examples:

"I'm 20."
→ save true

"My favorite color is black."
→ save true

"I love blue shirts."
→ save false

"I bought a blue shirt."
→ save false

"I'm studying Computer Science."
→ save true

"What is my favorite color?"
→ save false

Return ONLY JSON.
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
  shouldExtractMemory
}