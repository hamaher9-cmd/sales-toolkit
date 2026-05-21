// Whitelist: only these models can be requested. Anything else is rejected.
const ALLOWED_MODELS = [
  'claude-haiku-4-5',
  'claude-sonnet-4-6',
  'claude-opus-4-7'
]

const MAX_TOKENS_CAP = 2048

// Simple in-memory rate limiter (per server instance).
// Not bulletproof across many instances, but stops casual abuse.
const requestLog = new Map()
const RATE_LIMIT = 20          // max requests
const RATE_WINDOW_MS = 60000   // per 60 seconds

function isRateLimited(ip) {
  const now = Date.now()
  const timestamps = requestLog.get(ip) || []
  const recent = timestamps.filter(t => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    return true
  }
  recent.push(now)
  requestLog.set(ip, recent)
  return false
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limit by IP
  const ip = req.headers['x-forwarded-for'] || 'unknown'
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set on the server')
    return res.status(500).json({ error: 'This demo is temporarily unavailable. Please try again later.' })
  }

  try {
    const { model, max_tokens, system, messages } = req.body

    // Validate model against whitelist
    const safeModel = ALLOWED_MODELS.includes(model) ? model : 'claude-haiku-4-5'

    // Cap max_tokens so nobody can request a huge expensive response
    const safeMaxTokens = Math.min(max_tokens || 1024, MAX_TOKENS_CAP)

    // Basic shape validation
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Invalid request.' })
    }

    const requestBody = {
      model: safeModel,
      max_tokens: safeMaxTokens,
      messages: messages
    }
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
      // Log the real error server-side, send a generic message to the client
      const errorText = await anthropicRes.text()
      console.error('Anthropic API error:', anthropicRes.status, errorText)

      let friendly = 'Something went wrong generating a response. Please try again.'
      if (anthropicRes.status === 429) {
        friendly = 'The AI service is busy right now. Wait a moment and try again.'
      } else if (anthropicRes.status === 401 || (anthropicRes.status === 400 && errorText.includes('credit'))) {
        friendly = 'This demo is temporarily out of API credits. Please reach out to the developer to reactivate it.'
      } else if (anthropicRes.status >= 500) {
        friendly = 'The AI service hiccuped. Try again in a few seconds.'
      }
      return res.status(anthropicRes.status).json({ error: friendly })
    }

    const data = await anthropicRes.json()
    return res.status(200).json(data)
  } catch (error) {
    console.error('Server error in /api/claude:', error)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}