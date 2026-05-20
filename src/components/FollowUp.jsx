import { useState } from 'react'
import { callAnthropic } from '../lib/anthropic'
import ReactMarkdown from 'react-markdown'

function FollowUp() {
  const [notes, setNotes] = useState('')
  const [caseStudy, setCaseStudy] = useState('')
  const [valueResource, setValueResource] = useState('')
  const [scheduling, setScheduling] = useState('')
  const [followups, setFollowups] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGrounding, setShowGrounding] = useState(false)

  const [coachInput, setCoachInput] = useState('')
  const [coachContext, setCoachContext] = useState('')
  const [coachOutput, setCoachOutput] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [showCoach, setShowCoach] = useState(false)

  function resetModule() {
    setNotes('')
    setCaseStudy('')
    setValueResource('')
    setScheduling('')
    setFollowups('')
    setCoachInput('')
    setCoachContext('')
    setCoachOutput('')
  }

  async function generateFollowups() {
    setLoading(true)
    setFollowups('')

    let groundingSection = ''
    if (caseStudy || valueResource || scheduling) {
      groundingSection = `\n\n=== GROUNDING DATA — Real resources to reference ===\n`
      if (caseStudy) {
        groundingSection += `\n## Case study (Hot variant):\n${caseStudy}\n`
      }
      if (valueResource) {
        groundingSection += `\n## Value resource (Lukewarm variant):\n${valueResource}\n`
      }
      if (scheduling) {
        groundingSection += `\n## Scheduling info:\n${scheduling}\n`
      }
      groundingSection += `\n=== END GROUNDING DATA ===\n\nUse real resources instead of inventing fake ones.`
    }

    const prompt = `You are a senior SDR drafting follow-up emails after a discovery call. Generate TWO versions — one assuming the call went well, one assuming it was lukewarm.

Call notes:
${notes}${groundingSection}

Rules for both:
- Reference specific things from the call notes
- Body under 130 words
- No "Thanks for your time" filler
- Subject under 50 characters
- One clear next step

## Variant 1: Hot — push for next step
- Recap 1-2 key points in their language
- Confirm or propose a specific next step
- Reference the case study if provided
- Direct CTA with specific time

## Variant 2: Lukewarm — lead with value
- Acknowledge without being needy
- Lead with the value resource if provided
- Soft CTA, no pressure
- Make them want to respond because you're useful

Output each variant as:

**Subject:** [subject]

[body]

---`

    try {
      const result = await callAnthropic(prompt)
      setFollowups(result)
    } catch (error) {
      setFollowups('Error: ' + error.message)
    }

    setLoading(false)
  }

  async function critiqueEmail() {
    setCoachLoading(true)
    setCoachOutput('')

    const contextSection = coachContext ? `\n\n## Context the SDR provided:\n${coachContext}` : ''

    const prompt = `You are a senior sales leader critiquing a follow-up email an SDR wrote. Be direct and specific. No fluff.${contextSection}

## Email to critique:
${coachInput}

Respond in this exact structure:

## What works
2-3 specific things this email does well. Quote exact phrases.

## What doesn't work
3-5 specific issues. Quote problematic lines and explain why they weaken the email.

## Rewrite suggestion
Tightened version that fixes major issues. Stay close to SDR's voice. Subject included.

## One question to consider
One strategic question the SDR should ask themselves before sending.

Rules:
- Quote actual words when critiquing
- Don't sandwich criticism in praise
- If the email is strong, say so honestly`

    try {
      const result = await callAnthropic(prompt, 'sonnet')
      setCoachOutput(result)
    } catch (error) {
      setCoachOutput('Error: ' + error.message)
    }

    setCoachLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Follow-Up Drafter</h2>
        <button onClick={resetModule} className="reset-btn">Reset</button>
      </div>
      <p>Two versions: one for hot calls, one for lukewarm. Pick based on your read.</p>

      <div style={{ marginTop: '20px' }}>
        <label>
          Call notes:
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Names, pain points, quotes, next steps."
            rows={8}
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
              Case study (Hot variant):
              <textarea
                value={caseStudy}
                onChange={(e) => setCaseStudy(e.target.value)}
                placeholder="Real customer win with metrics."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Value resource (Lukewarm variant):
              <textarea
                value={valueResource}
                onChange={(e) => setValueResource(e.target.value)}
                placeholder="Useful article, framework, or insight."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Scheduling info:
              <textarea
                value={scheduling}
                onChange={(e) => setScheduling(e.target.value)}
                placeholder="e.g., calendly.com/yourname"
                rows={2}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>
        </div>
      )}

      <button
        onClick={generateFollowups}
        disabled={loading || !notes}
        style={{ marginTop: '15px', padding: '10px 20px' }}
      >
        {loading ? 'Generating...' : 'Generate Follow-Ups'}
      </button>

      {followups && (
        <div style={{ marginTop: '20px', padding: '15px 25px', background: '#2a2a2a', color: '#e0e0e0', border: '1px solid #444', borderRadius: '4px' }}>
          <ReactMarkdown>{followups}</ReactMarkdown>
        </div>
      )}

      {/* COACH SECTION */}
      <div style={{ marginTop: '30px', borderTop: '1px solid #444', paddingTop: '20px' }}>
        <button
          type="button"
          onClick={() => setShowCoach(!showCoach)}
          className="reset-btn"
          style={{ width: '100%', padding: '10px' }}
        >
          {showCoach ? '▼ Hide email coach' : '▶ Email coach (paste your draft, get critique)'}
        </button>
      </div>

      {showCoach && (
        <div style={{ marginTop: '15px' }}>
          <p style={{ fontSize: '13px', color: '#aaa' }}>
            Paste any follow-up email and get a senior-level critique. Uses Sonnet.
          </p>

          <div style={{ marginTop: '15px' }}>
            <label>
              Email to critique:
              <textarea
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Subject: ...&#10;&#10;Body..."
                rows={8}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Optional context:
              <textarea
                value={coachContext}
                onChange={(e) => setCoachContext(e.target.value)}
                placeholder="Who it's to, what you discussed on the call, your goal."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <button
            onClick={critiqueEmail}
            disabled={coachLoading || !coachInput}
            style={{ marginTop: '15px', padding: '10px 20px' }}
          >
            {coachLoading ? 'Critiquing...' : 'Critique Email'}
          </button>

          {coachOutput && (
            <div style={{ marginTop: '20px', padding: '15px 25px', background: '#1f2a1f', color: '#e0e0e0', border: '1px solid #3a5a3a', borderRadius: '4px' }}>
              <ReactMarkdown>{coachOutput}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FollowUp