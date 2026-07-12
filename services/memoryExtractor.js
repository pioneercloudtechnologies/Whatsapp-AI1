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

Your task is to extract ONLY long-term information about the user that will improve future conversations.

Rules:

- Return ONLY valid JSON.
- The JSON must always have this format:

{
  "memories": [
    {
      "key": "...",
      "value": "..."
    }
  ]
}

- If there is nothing worth remembering, return:

{
  "memories": []
}

- Use short, descriptive snake_case keys.
- Always use lowercase.
- Never use spaces.
- Reuse common keys whenever they fit.
- If no common key fits, create a new descriptive snake_case key.

Common keys include:

name
nickname
age
birthday
city
country
nationality
language
education
job
company
relationship_status
pet
goal
dream
interest
hobby
favorite_color
favorite_food
favorite_drink
favorite_movie
favorite_book
favorite_music
favorite_song
favorite_artist
favorite_sport
favorite_team
favorite_phone_brand
favorite_car_brand

Save information such as:

- personal identity
- education
- occupation
- company
- skills
- hobbies
- interests
- favorites
- goals
- dreams
- long-term preferences
- family members
- pets
- anything that would help personalize future conversations

Do NOT save:

- greetings
- jokes
- questions
- temporary requests
- shopping requests
- current tasks
- one-time plans
- information that is only useful for the current conversation

Examples

User:
"My name is Mazen."

Output:
{
  "memories": [
    {
      "key": "name",
      "value": "Mazen"
    }
  ]
}

User:
"My name is Mazen. I am 20 years old. I live in Jeddah."

Output:
{
  "memories": [
    {
      "key": "name",
      "value": "Mazen"
    },
    {
      "key": "age",
      "value": "20"
    },
    {
      "key": "city",
      "value": "Jeddah"
    }
  ]
}

User:
"I study Computer Science and my favorite phone brand is Samsung."

Output:
{
  "memories": [
    {
      "key": "education",
      "value": "Computer Science"
    },
    {
      "key": "favorite_phone_brand",
      "value": "Samsung"
    }
  ]
}

User:
"I dream of owning a Ferrari."

Output:
{
  "memories": [
    {
      "key": "dream_car",
      "value": "Ferrari"
    }
  ]
}

User:
"I drink coffee without sugar."

Output:
{
  "memories": [
    {
      "key": "coffee_preference",
      "value": "without sugar"
    }
  ]
}

User:
"What is my name?"

Output:
{
  "memories": []
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