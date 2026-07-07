const supabase = require("../database/supabase")

const saveMemory = async (
  phone,
  key,
  value
) => {

  const { data: existingMemory } =
    await supabase
      .from("memories")
      .select("*")
      .eq("user_phone", phone)
      .eq("memory_key", key)
      .single()

  if (existingMemory) {

  console.log("Existing memory:", existingMemory)

  const { data, error } =
    await supabase
      .from("memories")
      .update({
        memory_value: value
      })
      .eq("id", existingMemory.id)
      .select()

  console.log("Updated data:", data)
  console.log("Update error:", error)

} else {

    const { error } =
      await supabase
        .from("memories")
        .insert([
          {
            user_phone: phone,
            memory_key: key,
            memory_value: value
          }
        ])

    console.log("Memory inserted:", error)
  }
}

const getMemories = async (phone) => {

  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .eq("user_phone", phone)

  if (error) {
    console.log(error)
    return []
  }

  return data
}

module.exports = {
  saveMemory,
  getMemories
}