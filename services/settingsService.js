const supabase =
  require("../database/supabase")

const getUserSettings = async (phone) => {

  const { data } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("user_phone", phone)
    .maybeSingle()

  if (data) {
    return data
  }

  const {
    data: newSettings,
    error: insertError
  } = await supabase
    .from("ai_settings")
    .insert([
      {
        user_phone: phone
      }
    ])
    .select()
    .single()

  if (!insertError) {
    return newSettings
  }

  if (insertError.code === "23505") {
    const { data: existing } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_phone", phone)
      .maybeSingle()

    return existing
  }

  console.error("Failed to create settings:", insertError.message)
  return { personality: "", tone: "", creativity: "" }
}

const updatePersonality = async (phone, personality) => {
  const { error } = await supabase
    .from("ai_settings")
    .update({ personality })
    .eq("user_phone", phone)

  if (error) {
    console.error("Failed to update personality:", error.message)
    return false
  }

  return true
}

module.exports = {
  getUserSettings,
  updatePersonality
}
