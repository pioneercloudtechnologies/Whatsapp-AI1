const client = require("./openaiClient")

const createEmbedding = async (text) => {

  const response =
    await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text
    })

  return response.data[0].embedding
}

module.exports = {
  createEmbedding
}