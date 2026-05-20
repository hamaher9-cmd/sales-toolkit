import { useState } from 'react'
import { callAnthropic } from '../lib/anthropic'
import ReactMarkdown from 'react-markdown'

function PreCallIntel() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [linkedinInfo, setLinkedinInfo] = useState('')
  const [companyNews, setCompanyNews] = useState('')
  const [jobPostings, setJobPostings] = useState('')
  const [customerRef, setCustomerRef] = useState('')
  const [briefing, setBriefing] = useState('')
  const [loading, setLoading] = useState(false)
  const [showGrounding, setShowGrounding] = useState(false)

  function resetModule() {
    setCompany('')
    setRole('')
    setLinkedinInfo('')
    setCompanyNews('')
    setJobPostings('')
    setCustomerRef('')
    setBriefing('')
  }

  async function generateBriefing() {
    setLoading(true)
    setBriefing('')

    // Build grounding section only if any grounding fields have content
    let groundingSection = ''
    if (linkedinInfo || companyNews || jobPostings || customerRef) {
      groundingSection = `\n\n=== GROUNDING DATA — Use this real information instead of inventing details ===\n`
      if (linkedinInfo) {
        groundingSection += `\n## Prospect's LinkedIn / background:\n${linkedinInfo}\n`
      }
      if (companyNews) {
        groundingSection += `\n## Recent company news / signals:\n${companyNews}\n`
      }
      if (jobPostings) {
        groundingSection += `\n## Current job postings at the company:\n${jobPostings}\n`
      }
      if (customerRef) {
        groundingSection += `\n## Our closest customer reference (use for social proof / metrics):\n${customerRef}\n`
      }
      groundingSection += `\n=== END GROUNDING DATA ===\n\nIMPORTANT: Where the grounding data above provides specific facts, USE THOSE facts. Do not invent company sizes, news events, or customer metrics when real ones are provided. If a piece of grounding is absent, you may infer based on what's reasonable for a company of this profile, but flag any inferred specifics as "likely" rather than stated as fact.`
    } else {
      groundingSection = `\n\n(No grounding data provided. Generate the briefing from general knowledge, but mark any specific claims as "likely" rather than asserted facts.)`
    }

    const prompt = `You are a senior sales coach helping an SDR prepare for a cold call.

Company: ${company}
Prospect's role: ${role}${groundingSection}

Generate a pre-call briefing with these exact sections, using markdown headers:

## Company snapshot
2-3 sentences on what they do, size, recent news, and likely tech stack. Use the grounding data where available.

## Likely pain points for this role
3 specific business problems someone in this role probably faces, framed in their language. If job postings or company news suggest specific pains, prioritize those.

## MEDDPICC angle
- Metrics: what numbers they care about
- Economic buyer: who likely signs the check
- Decision criteria: what they'll evaluate vendors on
- Decision process: how decisions get made at companies this size
- Paper process: likely procurement/legal hurdles
- Identified pain: 2-3 problems we can credibly solve
- Champion: who in the org could become an internal advocate
- Competition: status quo and likely alternatives

## Three discovery questions
Sharp, open-ended questions that uncover pain without sounding scripted. If grounding data reveals a specific situation, reference it in at least one question.

## Conversation opener
A 2-sentence opener that earns the right to ask one more question. No "I know you're busy." No "I'll be brief." If a recent trigger event is in the grounding data, lead with that.

## Reference to use (if relevant)
If a customer reference was provided in grounding, suggest one specific way to weave it into the conversation. Otherwise skip this section.

Keep it tight. No filler. Write like the SDR is reading this 30 seconds before the call.`

    try {
      const result = await callAnthropic(prompt)
      setBriefing(result)
    } catch (error) {
      setBriefing('Error: ' + error.message)
    }

    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Pre-Call Intel</h2>
        <button onClick={resetModule} className="reset-btn">Reset</button>
      </div>
      <p>Generate a MEDDPICC-informed briefing before your call. Add grounding data for sharper output.</p>

      <div style={{ marginTop: '20px' }}>
        <label>
          Company name:
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., Datadog"
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
            placeholder="e.g., VP of Engineering"
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
          {showGrounding ? '▼ Hide grounding data (optional)' : '▶ Add grounding data (optional, for sharper output)'}
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
                placeholder="Paste their About section, recent posts, job history. Empty = skip."
                rows={4}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Recent company news / signals:
              <textarea
                value={companyNews}
                onChange={(e) => setCompanyNews(e.target.value)}
                placeholder="Funding rounds, layoffs, exec moves, product launches, earnings mentions, etc."
                rows={4}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Current job postings (huge signal for pain):
              <textarea
                value={jobPostings}
                onChange={(e) => setJobPostings(e.target.value)}
                placeholder="Paste 1-3 relevant job titles + brief snippets. E.g., 'Senior DBA — scaling 50TB+ Postgres clusters'"
                rows={4}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>

          <div style={{ marginTop: '15px' }}>
            <label>
              Closest customer reference (for social proof):
              <textarea
                value={customerRef}
                onChange={(e) => setCustomerRef(e.target.value)}
                placeholder="Paste a real customer win — company name (or 'similar company'), the problem, the result with specific metrics."
                rows={4}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </label>
          </div>
        </div>
      )}

      <button
        onClick={generateBriefing}
        disabled={loading || !company || !role}
        style={{ marginTop: '15px', padding: '10px 20px' }}
      >
        {loading ? 'Generating...' : 'Generate Briefing'}
      </button>

      {briefing && (
        <div style={{ marginTop: '20px', padding: '15px 25px', background: '#2a2a2a', color: '#e0e0e0', border: '1px solid #444', borderRadius: '4px' }}>
          <ReactMarkdown>{briefing}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}

export default PreCallIntel