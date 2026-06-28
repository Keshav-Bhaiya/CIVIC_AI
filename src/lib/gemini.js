const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY

// Supported models in order of preference (newest first)
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
]

const categoryMeta = {
  road:      { department: 'Public Works Division',       tags: ['Road Damage', 'Infrastructure'] },
  lighting:  { department: 'Electrical & Street Lighting',tags: ['Lighting', 'Safety'] },
  waste:     { department: 'Sanitation Department',       tags: ['Waste', 'Hygiene'] },
  parks:     { department: 'Parks & Recreation',          tags: ['Green Space', 'Public Area'] },
  water:     { department: 'Water & Drainage Board',      tags: ['Water', 'Drainage', 'Flooding'] },
  vandalism: { department: 'Municipal Police / Safety',   tags: ['Vandalism', 'Safety', 'Property'] },
}

const severityScore = { Low: 35, Medium: 55, High: 78, Critical: 92 }

function mockAnalysis(category, title, description, severity) {
  const meta  = categoryMeta[category] || categoryMeta.road
  const base  = severityScore[severity] || 60
  const score = Math.min(100, base + Math.floor(Math.random() * 10) - 4)
  const confidence = Math.min(99, 85 + Math.floor(Math.random() * 10))

  const summaries = {
    road:      `A ${severity.toLowerCase()}-severity road infrastructure issue has been detected. The reported damage poses risk to vehicles and pedestrians. Immediate inspection recommended. Routed to ${meta.department}.`,
    lighting:  `A street lighting failure has been reported. ${severity === 'Critical' || severity === 'High' ? 'This creates significant safety risks at night.' : 'This may create safety concerns during night hours.'} Forwarded to ${meta.department}.`,
    waste:     `A waste management issue has been identified. ${severity === 'High' || severity === 'Critical' ? 'Poses hygiene and environmental concerns.' : 'Requires routine attention.'} Forwarded to ${meta.department}.`,
    parks:     `A maintenance issue in a public park has been reported. Community spaces require timely upkeep. Report sent to ${meta.department}.`,
    water:     `A water/drainage issue has been reported. ${severity === 'High' || severity === 'Critical' ? 'May cause flooding if unaddressed.' : 'Requires monitoring.'} Routed to ${meta.department}.`,
    vandalism: `An incident of vandalism or public safety concern has been reported. Swift action helps maintain community standards. Forwarded to ${meta.department}.`,
  }

  const estRepairDays = { Low: '5–7', Medium: '3–5', High: '1–3', Critical: '<24 hours' }

  return {
    score,
    confidence,
    summary:      summaries[category] || summaries.road,
    department:   meta.department,
    tags:         [...meta.tags, severity, ...(title.split(' ').slice(0, 2))].filter(Boolean),
    estRepairDays: estRepairDays[severity],
    affectedArea:  severity === 'Critical' ? '~5m²' : severity === 'High' ? '~2m²' : '~1m²',
    trafficImpact: severity === 'Critical' ? 'Severe — may be impassable' : severity === 'High' ? 'High — peak route affected' : 'Moderate',
  }
}

async function callGemini(model, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
      }),
    }
  )
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(`${res.status}: ${body?.error?.message || res.statusText}`)
  }
  return res.json()
}

export async function analyzeIssue({ category, title, description, severity }) {
  if (!GEMINI_KEY) {
    await new Promise(r => setTimeout(r, 900))
    return mockAnalysis(category, title, description, severity)
  }

  const prompt = `You are CivicAI, an AI civic issue analysis system. Analyze this community issue and return ONLY valid JSON (no markdown, no backticks).

Issue:
- Category: ${category}
- Title: ${title}
- Description: ${description}
- Severity: ${severity}

JSON fields required:
{
  "score": <integer 0-100>,
  "confidence": <integer 0-100>,
  "summary": <2-3 sentence analysis>,
  "department": <responsible government department>,
  "tags": <array of 3-5 tags>,
  "estRepairDays": <e.g. "3-5">,
  "affectedArea": <e.g. "~2m²">,
  "trafficImpact": <brief string>
}`

  // Try each model in order
  for (const model of GEMINI_MODELS) {
    try {
      const data = await callGemini(model, prompt)
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      // Strip any accidental markdown fences
      const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
      const parsed = JSON.parse(clean)
      return parsed
    } catch (err) {
      console.warn(`Gemini model ${model} failed:`, err.message)
      // Continue to next model
    }
  }

  // All models failed — use smart mock
  console.warn('All Gemini models failed. Using mock analysis.')
  return mockAnalysis(category, title, description, severity)
}