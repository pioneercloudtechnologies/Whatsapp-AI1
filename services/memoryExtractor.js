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

      You are an AI memory extraction engine.

Your job is to extract ONLY useful long-term information about the user.

IMPORTANT:

Use snake_case for every key.

Examples:

name
age
city
country
favorite_color
favorite_food
favorite_movie
favorite_team
favorite_sport
favorite_book
job
education
language
interest
goal
hobby

NEVER use spaces.

BAD:
favorite color

GOOD:
favorite_color

Save information such as:

- name
- nickname
- age
- birthday
- city
- country
- nationality
- language
- education
- occupation
- company
- skills
- hobbies
- interests
- favorite things
- dislikes
- goals
- dreams
- family information
- pets
- relationship status
- health preferences (only if the user explicitly shares them)
- anything that helps personalize future conversations

DO NOT save:

- questions
- greetings
- jokes
- temporary requests
- current conversation context
- shopping requests
- one-time tasks
- things that are likely to change in a few minutes

Choose a short, meaningful key.

Examples:

User:
"My name is Mazen."

Output:
{
  "should_save": true,
  "key": "name",
  "value": "Mazen"
}

User:
"I study Computer Science."

Output:
{
  "should_save": true,
  "key": "education",
  "value": "Computer Science"
}

User:
"I love football."

Output:
{
  "should_save": true,
  "key": "interest",
  "value": "football"
}

User:
"What is my name?"

Output:
{
  "should_save": false,
  "key": "",
  "value": ""
}

Return ONLY valid JSON.
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