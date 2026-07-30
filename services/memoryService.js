const supabase = require("../database/supabase")

const {
  createEmbedding
} = require("./embeddingService")

const saveMemory = async (
  phone,
  key,
  value
) => {

  let embedding = null

try {

  embedding = await createEmbedding(
    `Key: ${key}\nValue: ${value}`
  )

} catch (error) {

  console.log(
    "Embedding error:",
    error.message
  )

}
  const {
    data: existingMemory,
    error: findError
  } =
    await supabase
      .from("memories")
      .select("*")
      .eq("user_phone", phone)
      .eq("memory_key", key)
      .single()

  console.log("Existing memory:", existingMemory)
  console.log("Find error:", findError)

  if (existingMemory) {

    const {
      data,
      error
    } =
      await supabase
        .from("memories")
        .update({
          memory_value: value,
          embedding: embedding
        })
        .eq("id", existingMemory.id)
        .select()

    console.log("Updated row:", data)
    console.log("Update error:", error)

  } else {

    const {
      data,
      error
    } =
      await supabase
        .from("memories")
        .insert([
          {
            user_phone: phone,
            memory_key: key,
            memory_value: value,
            embedding: embedding
          }
        ])
        .select()

    console.log("Inserted row:", data)
    console.log("Insert error:", error)

  }
}

const getMemories = async (phone) => {

  const { data, error } =
    await supabase
      .from("memories")
      .select("*")
      .eq("user_phone", phone)

  if (error) {
    console.log(error)
    return []
  }

  return data
}

const searchRelevantMemories = async (
  phone,
  message
) => {

  const embedding =
    await createEmbedding(message)

  const {
    data,
    error
  } = await supabase.rpc(
    "match_memories",
    {
      query_embedding: embedding,
      match_threshold: 0.4,
      match_count: 20,
      user_phone_input: phone
    }
  )

  if (error) {
    console.log("Memory search error:", error)
    return []
  }

  return data
}

module.exports = {
  saveMemory,
  getMemories,
  searchRelevantMemories
}