const supabase = require("../database/supabase")

const saveMemory = async (
  phone,
  key,
  value
) => {

  await supabase
    .from("memories")
    .insert([
      {
        user_phone: phone,
        memory_key: key,
        memory_value: value
      }
    ])
}

module.exports = {
  saveMemory,
  getMemories
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