const handleWebhookMessage = async (req, res) => {
  try {

    res.sendStatus(200)

  } catch (error) {
    console.log(error.message)
    res.sendStatus(500)
  }
}

module.exports = {
  handleWebhookMessage
}