const supabase =
  require("../database/supabase")

const getUserSettings = async (phone) => {

  let { data, error } = await supabase
    .from("ai_settings")
    .select("*")
    .eq("user_phone", phone)
    .single()

  console.log("Settings:", data)
  console.log("Settings error:", error)

  if (!data) {

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

    console.log("New settings:", newSettings)
    console.log("Settings insert error:", insertError)

    data = newSettings
  }

  return data
}

module.exports = {
  getUserSettings
}