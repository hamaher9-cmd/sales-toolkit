export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' })
  }

  try {
    const { model, max_tokens, system, messages } = req.body

    const requestBody = {
      model: model || 'claude-haiku-4-5',
      max_tokens: max_tokens || 2048,
      messages: messages
    }

    // Only include system if it was provided
    if (system) {
      requestBody.system = system
    }

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    if (!anthropicRes.ok) {
      const errorText = await anthropicRes.text()
      return res.status(anthropicRes.status).json({ error: errorText })
    }

    const data = await anthropicRes.json()
    return res.status(200).json(data)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}