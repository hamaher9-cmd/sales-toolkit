import { useState } from 'react'
import { callAnthropicWithHistory, callAnthropic } from '../lib/anthropic'

function LiveSimulator() {
  const [product, setProduct] = useState('')
  const [persona, setPersona] = useState('')
  const [prospectBackground, setProspectBackground] = useState('')
  const [recentNews, setRecentNews] = useState('')
  const [currentStack, setCurrentStack] = useState('')
  const [callState, setCallState] = useState('setup')
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [coaching, setCoaching] = useState('')
  const [loading, setLoading] = useState(false)
  const [disposition, setDisposition] = useState('')
  const [showGrounding, setShowGrounding] = useState(false)

  function randomDisposition() {
    const roll = Math.random()
    if (roll < 0.40) return 'cold-dismissive'
    if (roll < 0.75) return 'polite-skeptical'
    if (roll < 0.93) return 'curious-cautious'
    return 'genuinely-interested'
  }

  function endCall() {
  setCallState('setup')
  setMessages([])
  setCoaching('')
  setUserInput('')
  setDisposition('')
}

function newScenario() {
  setCallState('setup')
  setMessages([])
  setCoaching('')
  setUserInput('')
  setDisposition('')
  setProduct('')
  setPersona('')
  setProspectBackground('')
  setRecentNews('')
  setCurrentStack('')
  setShowGrounding(false)
}

  function buildProspectSystemPrompt(rolledDisposition) {
    let groundingSection = ''
    if (prospectBackground || recentNews || currentStack) {
      groundingSection = '\n\nADDITIONAL PROSPECT CONTEXT (use to make your responses specific and realistic):\n'
      if (prospectBackground) {
        groundingSection += '\nYour background: ' + prospectBackground + '\n'
      }
      if (recentNews) {
        groundingSection += '\nRecent news/events at your company: ' + recentNews + '\n'
      }
      if (currentStack) {
        groundingSection += '\nYour current tools/stack/status quo: ' + currentStack + '\n'
      }
      groundingSection += '\nDraw from these specifics when relevant. Your DISPOSITION still controls whether you actually share this info.'
    }

    return `You are roleplaying as a realistic B2B prospect receiving a cold call. Stay in character. Do not break character to coach the SDR — coaching is handled separately.

PRODUCT THE SDR IS SELLING: ${product}

YOUR ROLE/PERSONA: ${persona}${groundingSection}

YOUR HIDDEN DISPOSITION (do NOT reveal — let it show through behavior): ${rolledDisposition}

DISPOSITION GUIDE — Strict rules. Do not soften during the call.

- cold-dismissive:
  Annoyed at being interrupted. Maximum 3 turns before ending the call.
  Replies are 5-12 words. Never longer.
  Never share specific data. Deflect: "Why?" / "I don't share that on cold calls."
  Never agree to an email or meeting.
  End with: "I have to go." / "Not interested, remove me from your list."
  Do NOT warm up regardless of how good the SDR is.

- polite-skeptical:
  Professional but not their friend. 4-6 turns before politely exiting.
  Replies 1-2 short sentences.
  Will NOT share numbers unless the SDR asks something sharp and earned.
  Default vague: "It varies." / "Pretty well." / "Rather not on a cold call."
  May agree to an email IF SDR offers something specific without pressure.
  Will NOT agree to a meeting unless SDR demonstrates real understanding.
  Exit lines: "Send me something and I'll take a look." / "Now's not a good time."

- curious-cautious:
  Tangentially related pain. Skeptical but reachable. 6-10 turns.
  Asks 1-2 sharp questions to test whether the SDR knows your world.
  Shares SOME specific info after SDR demonstrates relevance.
  Agrees to meeting ONLY if SDR specifically references your situation.
  If agreeing, propose a specific day/time.

- genuinely-interested:
  Was thinking about this problem this week. Rare. Engages substantively.
  Asks about: who else uses it, pricing range, implementation effort.
  Agrees to meeting unless SDR is grossly incompetent.

CRITICAL: Your disposition does NOT improve. A cold-dismissive prospect who hears a great pitch is still cold-dismissive.

OTHER RULES:
- Speak ONLY as the prospect. 1-3 short sentences per turn.
- React to what the SDR actually said.
- If the SDR is rude, end the call.
- If you decide the call should end, include [CALL_ENDED] at the end of your response.

Respond with ONLY your in-character dialogue. No JSON, no formatting, no labels — just what you say out loud to the SDR.`
  }

  function buildCoachPrompt(conversationSoFar, dispositionRolled) {
    const transcript = conversationSoFar
      .filter(m => !m.hidden)
      .map(m => `${m.role === 'user' ? 'SDR' : 'Prospect'}: ${m.display}`)
      .join('\n\n')

    return `You are a senior sales coach reviewing a cold call in real time. Critique the SDR's most recent message ONLY. Be direct and specific. No fluff, no sandwich praise.

KEY FACTS:
- The SDR is selling: ${product}
- The prospect's hidden disposition: ${dispositionRolled}
- The SDR cannot see the disposition; the coach can.

FULL CALL TRANSCRIPT SO FAR:
${transcript}

YOUR JOB:
Give ONE coaching note (2-4 sentences) on the SDR's most recent message. The coaching must:
- Reference what the SDR LITERALLY said. Quote their actual words if criticizing them. Never make up things they didn't say.
- Account for the prospect's disposition. (Pushing harder on a cold-dismissive is a waste; pushing harder on a curious-cautious might be exactly right.)
- Be useful, not generic. "Be more confident" is useless. "When she asked X you should have Y" is useful.
- Avoid praise-only feedback unless the SDR genuinely nailed it. If they did, say specifically what worked and why.

Respond with ONLY the coaching note as plain prose. No headers, no formatting, no labels. 2-4 sentences max.`
  }

 async function startCall() {
  const rolledDisposition = randomDisposition()
  setDisposition(rolledDisposition)
  setMessages([])
  setCoaching('')
  setUserInput('')
  setCallState('active')
  setLoading(true)

  const systemPrompt = buildProspectSystemPrompt(rolledDisposition)
  const initialUserMessage = '[The SDR has just dialed your number. Your phone rings. You answer.]'

  try {
    const prospectReply = await callAnthropicWithHistory(systemPrompt, [
      { role: 'user', content: initialUserMessage }
    ])

    const newMessages = [
      { role: 'system', content: systemPrompt, hidden: true, disposition: rolledDisposition },
      { role: 'user', content: initialUserMessage, hidden: true },
      { role: 'assistant', content: prospectReply, display: prospectReply.replace('[CALL_ENDED]', '').trim() }
    ]
    setMessages(newMessages)
    setCoaching('Call started. Make your opener.')

    if (prospectReply.includes('[CALL_ENDED]')) {
      setCallState('ended')
    }
  } catch (error) {
    console.error('Start call error:', error)
    setCoaching('Error starting call: ' + error.message)
  }
  setLoading(false)
}

 async function sendMessage() {
  if (!userInput.trim()) return
  setLoading(true)

  const newUserMsg = { role: 'user', content: userInput, display: userInput }
  const updatedMessages = [...messages, newUserMsg]
  setMessages(updatedMessages)
  setUserInput('')

  // Rebuild system prompt fresh from current state — don't trust messages[0]
  const rolledDisposition = messages[0]?.disposition || disposition
  const systemPrompt = buildProspectSystemPrompt(rolledDisposition)

  const conversationHistory = updatedMessages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role, content: m.content }))

  try {
    const prospectReply = await callAnthropicWithHistory(systemPrompt, conversationHistory)

    const assistantMsg = {
      role: 'assistant',
      content: prospectReply,
      display: prospectReply.replace('[CALL_ENDED]', '').trim()
    }
    const messagesAfterProspect = [...updatedMessages, assistantMsg]
    setMessages(messagesAfterProspect)

    if (prospectReply.includes('[CALL_ENDED]')) {
      setCallState('ended')
    }

    const coachPrompt = buildCoachPrompt(messagesAfterProspect, rolledDisposition)
    const coachNote = await callAnthropic(coachPrompt, 'sonnet')
    setCoaching(coachNote)
  } catch (error) {
    console.error('Send message error:', error)
    setCoaching('Error: ' + error.message)
  }
  setLoading(false)
}

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <h2>Live Sales Simulator</h2>
  <div style={{ display: 'flex', gap: '8px' }}>
    <button onClick={endCall} className="reset-btn">End Call</button>
    <button onClick={newScenario} className="reset-btn">New Scenario</button>
  </div>
</div>
      <p>A randomized prospect. Most won't buy. That's the point.</p>

      {callState === 'setup' && (
        <div>
          <div style={{ marginTop: '20px' }}>
            <label>
              What you're selling:
              <textarea
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder="e.g., AI-powered SDR coaching platform..."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Prospect persona:
              <textarea
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                placeholder="e.g., VP of Sales at a Series B SaaS company..."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setShowGrounding(!showGrounding)}
              className="reset-btn"
              style={{ width: '100%', padding: '10px' }}
            >
              {showGrounding ? '▼ Hide grounding data' : '▶ Add grounding data (optional)'}
            </button>
          </div>

          {showGrounding && (
            <div style={{ marginTop: '15px', padding: '15px', background: '#1f1f1f', border: '1px solid #333', borderRadius: '4px' }}>
              <div>
                <label>
                  Prospect's background (LinkedIn-style):
                  <textarea
                    value={prospectBackground}
                    onChange={(e) => setProspectBackground(e.target.value)}
                    placeholder="Their history, previous roles, recent posts."
                    rows={3}
                    style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  />
                </label>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label>
                  Recent news/events at their company:
                  <textarea
                    value={recentNews}
                    onChange={(e) => setRecentNews(e.target.value)}
                    placeholder="Funding, layoffs, launches, exec moves."
                    rows={3}
                    style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  />
                </label>
              </div>

              <div style={{ marginTop: '15px' }}>
                <label>
                  Their current tools / status quo:
                  <textarea
                    value={currentStack}
                    onChange={(e) => setCurrentStack(e.target.value)}
                    placeholder="What they're using now."
                    rows={3}
                    style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                  />
                </label>
              </div>
            </div>
          )}

          <button
            onClick={startCall}
            disabled={loading || !product || !persona}
            style={{ marginTop: '15px', padding: '10px 20px' }}
          >
            {loading ? 'Dialing...' : 'Start Call'}
          </button>
        </div>
      )}

      {(callState === 'active' || callState === 'ended') && (
        <div>
          <div style={{ marginTop: '20px', padding: '15px', background: '#2a2a2a', border: '1px solid #444', borderRadius: '4px', maxHeight: '400px', overflowY: 'auto' }}>
            {messages.filter(m => !m.hidden).map((m, i) => (
              <div key={i} style={{ marginBottom: '12px' }}>
                <strong style={{ color: m.role === 'user' ? '#7fc8e0' : '#e0c97f' }}>
                  {m.role === 'user' ? 'You' : 'Prospect'}:
                </strong>
                <div style={{ marginTop: '2px' }}>{m.display}</div>
              </div>
            ))}
          </div>

          {coaching && (
            <div style={{ marginTop: '12px', padding: '12px 15px', background: '#1f2a1f', border: '1px solid #3a5a3a', borderRadius: '4px', fontSize: '14px' }}>
              <strong style={{ color: '#7fe07f' }}>Coach: </strong>
              <span style={{ color: '#cfe0cf' }}>{coaching}</span>
            </div>
          )}

          {callState === 'active' && (
            <div style={{ marginTop: '15px', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage()}
                placeholder="What do you say?"
                disabled={loading}
                style={{ flex: 1, padding: '8px' }}
              />
              <button onClick={sendMessage} disabled={loading || !userInput.trim()} style={{ padding: '8px 16px' }}>
                {loading ? '...' : 'Send'}
              </button>
            </div>
          )}

          {callState === 'ended' && (
            <div style={{ marginTop: '15px', padding: '12px', background: '#2a1f1f', border: '1px solid #5a3a3a', borderRadius: '4px' }}>
              <strong style={{ color: '#e07f7f' }}>Call ended.</strong>
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#aaa' }}>
                Prospect disposition was: <strong>{disposition}</strong>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default LiveSimulator