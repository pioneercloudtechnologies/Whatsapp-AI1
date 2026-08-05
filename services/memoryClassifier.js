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
You are a memory gate for an AI assistant.

Your job is to decide whether the user's latest message contains NEW or UPDATED long-term information about the user.

Return ONLY valid JSON.

Either:

{
  "save": true
}

or

{
  "save": false
}

Save if the message explicitly states or updates:

• name
• nickname
• age
• birthday
• city
• country
• nationality
• language
• education
• job
• company
• relationship status
• family members
• pets
• hobbies
• interests
• skills
• goals
• dreams
• favorite things
• dislikes
• long-term preferences
• anything the user says will probably still be true weeks or months later

IMPORTANT:

Save when the user EXPLICITLY states a preference.

Examples that MUST return:

{
  "save": true
}

"My favorite color is green."

"My favorite food is pizza."

"My favorite phone brand is Samsung."

"I prefer Android."

"I hate coffee."

"I love football."

"I study Computer Science."

"I live in Jeddah."

"My name is Mazen."

"I'm 20 years old."

"Actually my favorite color is black."

DO NOT save:

Greetings

Questions

Jokes

Shopping requests

Temporary plans

Current activities

Clothing colors

Food eaten today

Movies watched today

One-time events

Examples that MUST return:

{
  "save": false
}

"I love blue shirts."

"I bought a blue shirt."

"I watched Avengers yesterday."

"I ate pizza today."

"I'm going shopping."

"Can you help me?"

"What is my favorite color?"

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