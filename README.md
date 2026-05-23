# Sales Toolkit

An AI-powered toolkit for sales development reps (SDRs). It handles the four things that support an SDR's development: prepping for calls, writing cold emails, drafting follow-ups, and practicing live calls against a realistic prospect.

I built this while teaching myself to code and transitioning into tech sales. The goal was twofold: learn how to make a simple toolkit, and learn the SDR workflow well enough to model it.

**Live demo:** [sales-toolkit-nu.vercel.app](https://sales-toolkit-nu.vercel.app)

> Heads up: the demo runs on a small prepaid API budget. If the AI features return an error, it may be temporarily out of credits — feel free to reach out and I'll top it up.

## What it does

**Pre-Call Intel** — Enter a company and a prospect's role, optionally paste in real grounding data (their LinkedIn, recent company news, job postings, a customer reference, your own notes), and get a MEDDPICC-informed briefing: likely pain points, discovery questions, a conversation opener, and a read on the buying committee.

**Cold Email Generator** — Produces three cold emails for the same prospect, each from a different angle (pain-led, trigger event, social proof). Includes a built-in coach that critiques any email you paste in and suggests a rewrite.

**Follow-Up Drafter** — Turns rough call notes into two follow-up emails: one for a hot call (push for the next step) and one for a lukewarm call (lead with value). Also has the email coach asjusted slightly.

**Live Sales Simulator** — A cold-call roleplay. You're dropped into a call with a randomized prospect whose disposition (dismissive, skeptical, curious, interested) is hidden from you — weighted so most prospects don't buy, like real life. A separate AI coach critiques each of your moves in real time.

## Why I built it this way

A few decisions worth explaining:

- **Grounding over generation.** Early versions just made up plausible-sounding details. Adding optional fields where you paste real research (LinkedIn, news, job posts) turns generic AI output into something that references actual facts. The difference is the gap between something that neat and something that shows you how to do the task.

- **Secure backend.** The app calls the Anthropic API through a serverless function instead of from the browser, so the API key never reaches the client. This was done after I had exposed my key about twice. It was a valuable lesson into why looking for holes in your own plans is valuable.

- **Two-model approach.** Bulk generation runs on a fast, cheap model (Claude Haiku). The judgment-heavy tasks — the live simulator and the email critiques — run on a stronger model (Claude Sonnet/Opus) where conversational nuance matters.

- **Separated simulator coach.** Decided this because, especially in prolonged sessions, the coach and prospect would overlap in their responses and be inconsistent with temperment. Separating the api calls allowed for each to have its own memory and role, creating notably better outputs.

## Tech stack

- React + Vite (frontend)
- Vercel serverless functions (backend, keeps the API key off the client)
- Anthropic API (Claude Haiku, Sonnet, Opus)
- Deployed on Vercel

## Running it locally

You'll need Node.js and an Anthropic API key.

```bash
git clone https://github.com/hamaher9-cmd/sales-toolkit.git
cd sales-toolkit
npm install

# create a file named .env in the root with:
# ANTHROPIC_API_KEY=your-key-here

vercel dev
```

The app runs at `localhost:3000`.

## What this is and isn't

This isn't trying to replace Outreach or Salesloft. It's a learning tool built by one person trying to learn sales and systems development. I chose this because with the rise of AI, the people who will stick out are the ones who understand how to use it to their advantage.  

## About me

I built this project on my personal computer in my off time while working full-time at Taco Bell. I knew very little about programming and development despite being interested in it my whole life. I also knew that sales is the first step on the career ladder I want to climb. The entire goal, learn both and apply them at the same time. I hope you get 5 minutes of enjoyment, feel free to reach out if theres any bugs, issues, questions, or comments. 

Name- Hayden Maher
Email- hamaher9@outlook.com
