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

    console.error(
      "Embedding error:",
      error.message
    )

  }

  const {
    data: existingMemory
  } =
    await supabase
      .from("memories")
      .select("*")
      .eq("user_phone", phone)
      .eq("memory_key", key)
      .maybeSingle()

  if (existingMemory) {

    const { error } =
      await supabase
        .from("memories")
        .update({
          memory_value: value,
          embedding: embedding
        })
        .eq("id", existingMemory.id)

    if (error) {
      console.error("Failed to update memory:", error.message)
    }

  } else {

    const { error } =
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

    if (error) {
      console.error("Failed to insert memory:", error.message)
    }

  }
}

const getMemories = async (phone) => {

  const { data, error } =
    await supabase
      .from("memories")
      .select("*")
      .eq("user_phone", phone)
      .order("memory_key", { ascending: true })

  if (error) {
    console.error("Failed to fetch memories:", error.message)
    return []
  }

  return data
}

const deleteMemory = async (phone, key) => {
  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("user_phone", phone)
    .eq("memory_key", key)

  if (error) {
    console.error("Failed to delete memory:", error.message)
    return false
  }

  return true
}

const deleteAllMemories = async (phone) => {
  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("user_phone", phone)

  if (error) {
    console.error("Failed to delete memories:", error.message)
    return false
  }

  return true
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
    console.error("Memory search error:", error.message)
    return []
  }

  return data
}

module.exports = {
  saveMemory,
  getMemories,
  deleteMemory,
  deleteAllMemories,
  searchRelevantMemories
}
