import { useState } from 'react'
import { callAnthropic } from '../lib/anthropic'
import ReactMarkdown from 'react-markdown'

function ColdEmail() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [product, setProduct] = useState('')
  const [linkedinInfo, setLinkedinInfo] = useState('')
  const [triggerEvent, setTriggerEvent] = useState('')
  const [customerRef, setCustomerRef] = useState('')
  const [painHypothesis, setPainHypothesis] = useState('')
  const [emails, setEmails] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGrounding, setShowGrounding] = useState(false)

  // Coach state
  const [coachInput, setCoachInput] = useState('')
  const [coachContext, setCoachContext] = useState('')
  const [coachOutput, setCoachOutput] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [showCoach, setShowCoach] = useState(false)

  function resetModule() {
    setCompany('')
    setRole('')
    setProduct('')
    setLinkedinInfo('')
    setTriggerEvent('')
    setCustomerRef('')
    setPainHypothesis('')
    setEmails('')
    setCoachInput('')
    setCoachContext('')
    setCoachOutput('')
  }

  async function generateEmails() {
    setLoading(true)
    setEmails('')

    let groundingSection = ''
    if (linkedinInfo || triggerEvent || customerRef || painHypothesis) {
      groundingSection = `\n\n=== GROUNDING DATA — Use this real information instead of inventing details ===\n`
      if (linkedinInfo) {
        groundingSection += `\n## Prospect's LinkedIn / background:\n${linkedinInfo}\n`
      }
      if (triggerEvent) {
        groundingSection += `\n## Recent trigger event (use as the hook for Variant 2):\n${triggerEvent}\n`
      }
      if (customerRef) {
        groundingSection += `\n## Real customer reference (use as the social proof for Variant 3 — DO NOT INVENT METRICS):\n${customerRef}\n`
      }
      if (painHypothesis) {
        groundingSection += `\n## My hypothesis on their specific pain:\n${painHypothesis}\n`
      }
      groundingSection += `\n=== END GROUNDING DATA ===\n\nIMPORTANT: Use real facts from grounding instead of fabricating. If customer reference is provided, the Social Proof variant MUST use it.`
    }

    const prompt = `You are a senior SDR writing cold outbound emails. Generate THREE email variants for the same prospect, each using a different strategic angle.

Prospect's company: ${company}
Prospect's role: ${role}
Product/service I'm selling: ${product}${groundingSection}

Constraints for ALL emails:
- Subject line under 50 characters, no clickbait, no all-caps
- Body under 125 words
- No "I hope this email finds you well" / "I know you're busy" / "Just wanted to reach out"
- No paragraphs longer than 2 sentences
- One specific call-to-action, low-commitment (15-min call, not "demo")
- Sound like a human, not a marketing automation tool
- Mobile-readable formatting

Generate three variants:

## Variant 1: Pain-led
Open with a specific operational problem. Tie our product to that pain. CTA.

## Variant 2: Trigger event
Open with the trigger event from grounding if provided. Connect to a pain. CTA.

## Variant 3: Social proof
Open with the customer reference from grounding if provided — real name, real metrics. CTA.

For EACH variant, output in this exact format:

**Subject:** [subject line here]

[body here]

---

Output all three variants separated by horizontal rules.`

    try {
      const result = await callAnthropic(prompt)
      setEmails(result)
    } catch (error) {
      setEmails('Error: ' + error.message)
    }

    setLoading(false)
  }

  async function critiqueEmail() {
    setCoachLoading(true)
    setCoachOutput('')

    const contextSection = coachContext ? `\n\n## Context the SDR provided (use to assess fit):\n${coachContext}` : ''

    const prompt = `You are a senior sales leader critiquing a cold email an SDR wrote. Be direct and specific. No fluff, no "great job overall" preamble. Identify what works, what doesn't, and rewrite the weakest parts.${contextSection}

## Email to critique:
${coachInput}

Respond in this exact structure using markdown:

## What works
2-3 specific things this email does well. Quote the exact phrases.

## What doesn't work
3-5 specific issues. For each issue, quote the problematic line and explain why it weakens the email. Be brutal but useful — generic feedback is useless.

## Rewrite suggestion
Provide a tightened version of the email that fixes the major issues. Stay close to the SDR's voice — don't replace their style with corporate-speak. Subject line included.

## One question to consider
End with one strategic question the SDR should ask themselves about this email before sending (audience fit, timing, the actual ask, etc.).

Rules:
- Quote the SDR's actual words when critiquing — never paraphrase what they "kind of" said
- Don't sandwich criticism in praise. Be honest.
- If the email is genuinely strong, say so and explain why instead of inventing problems.`

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
        <h2>Cold Email Generator</h2>
        <button onClick={resetModule} className="reset-btn">Reset</button>
      </div>
      <p>Three variants, three angles, one prospect. Grounding data turns emails from generic to landing.</p>

      <div style={{ marginTop: '20px' }}>
        <label>
          Prospect's company:
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Stripe"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </label>
      </div>

      <div style={{ marginTop: '15px' }}>
        <label>
          Prospect's role:
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., Director of RevOps"
            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
          />
        </label>
      </div>

      <div style={{ marginTop: '15px' }}>
        <label>
          What I'm selling (1-2 sentences):
          <textarea
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g., AI-powered sales intelligence platform..."
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
          {showGrounding ? '▼ Hide grounding data' : '▶ Add grounding data (optional, for sharper output)'}
        </button>
      </div>

      {showGrounding && (
        <div style={{ marginTop: '15px', padding: '15px', background: '#1f1f1f', border: '1px solid #333', borderRadius: '4px' }}>
          <div>
            <label>
              Prospect's LinkedIn / background:
              <textarea
                value={linkedinInfo}
                onChange={(e) => setLinkedinInfo(e.target.value)}
                placeholder="Paste their About, recent posts, job history."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Recent trigger event (highest-leverage field):
              <textarea
                value={triggerEvent}
                onChange={(e) => setTriggerEvent(e.target.value)}
                placeholder="Funding, leadership change, product launch, hiring spike."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Real customer reference (kills fake metrics):
              <textarea
                value={customerRef}
                onChange={(e) => setCustomerRef(e.target.value)}
                placeholder="Real company, real problem, real result with real metrics."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Pain hypothesis:
              <textarea
                value={painHypothesis}
                onChange={(e) => setPainHypothesis(e.target.value)}
                placeholder="Your guess at their specific pain, based on research."
                rows={3}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>
        </div>
      )}

      <button
        onClick={generateEmails}
        disabled={loading || !company || !role || !product}
        style={{ marginTop: '15px', padding: '10px 20px' }}
      >
        {loading ? 'Generating...' : 'Generate Emails'}
      </button>

      {emails && (
        <div style={{ marginTop: '20px', padding: '15px 25px', background: '#2a2a2a', color: '#e0e0e0', border: '1px solid #444', borderRadius: '4px' }}>
          <ReactMarkdown>{emails}</ReactMarkdown>
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
            Paste any cold email — yours, from this generator, or anywhere else — and get a senior-level critique. Uses Sonnet for sharper analysis.
          </p>

          <div style={{ marginTop: '15px' }}>
            <label>
              Email to critique (include subject + body):
              <textarea
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Subject: ...&#10;&#10;Hi [name],&#10;&#10;..."
                rows={8}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Optional context (who's it to, what are you selling, what's your goal):
              <textarea
                value={coachContext}
                onChange={(e) => setCoachContext(e.target.value)}
                placeholder="e.g., Sending to VP RevOps at Series B SaaS, selling SDR coaching tool. Goal: book a 15-min intro call."
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

export default ColdEmail