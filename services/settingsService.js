const supabase =
  require("../database/supabase")

const getUserSettings =
  async (phone) => {

    let { data } = await supabase
      .from("ai_settings")
      .select("*")
      .eq("user_phone", phone)
      .single()

    if (!data) {

      const { data: newSettings } =
        await supabase
          .from("ai_settings")
          .insert([
            {
              user_phone: phone
            }
          ])
          .select()
          .single()

      data = newSettings
    }

    return data
}

module.exports = {
  getUserSettings
}