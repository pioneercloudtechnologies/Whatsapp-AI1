const supabase = require("../database/supabase")

const saveMemory = async (
  phone,
  key,
  value
) => {

  const { data, error } = await supabase
    .from("memories")
    .insert([
      {
        user_phone: phone,
        memory_key: key,
        memory_value: value
      }
    ])
  console.log("Memory insert:", data)
  console.log("Memory error:", error)
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