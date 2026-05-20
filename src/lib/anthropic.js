export async function callAnthropic(prompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const url = 'https://api.anthropic.com/v1/messages'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || 'No response.'
}
export async function callAnthropicWithHistory(systemPrompt, messages) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  const url = 'https://api.anthropic.com/v1/messages'

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    })
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Anthropic API error (${res.status}): ${errorText}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}