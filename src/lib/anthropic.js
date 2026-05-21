const MODELS = {
  haiku: 'claude-haiku-4-5',
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-7'
}

async function callClaude(requestBody) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(errorData.error || `API error (${res.status})`)
  }

  return res.json()
}

export async function callAnthropic(prompt, modelChoice = 'haiku') {
  const data = await callClaude({
    model: MODELS[modelChoice] || MODELS.haiku,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }]
  })
  return data.content?.[0]?.text || 'No response.'
}

export async function callAnthropicWithHistory(systemPrompt, messages, modelChoice = 'sonnet') {
  const data = await callClaude({
    model: MODELS[modelChoice] || MODELS.sonnet,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages
  })
  return data.content?.[0]?.text || ''
}