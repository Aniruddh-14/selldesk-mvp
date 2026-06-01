const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

function mockRecommendations(rows, flags) {
  const recs = []
  const dangerItems  = flags.danger.map(f => f.row.item)
  const warningItems = flags.warning.map(f => f.row.item)
  const starItems    = flags.success.map(f => f.row.item)

  // Pricing — only if there are low-margin items
  if (dangerItems.length > 0) {
    recs.push({
      title: `Reprice ${dangerItems[0]} to hit 30% margin`,
      detail: `${dangerItems[0]} is below the 25% margin floor. A ₹10–15 price increase is unlikely to affect demand and immediately improves profitability.`,
      type: 'pricing',
      impact: 'high',
    })
  }

  // Combo — only if there are slow movers
  if (warningItems.length > 0) {
    recs.push({
      title: `Bundle ${warningItems[0]} with a bestseller`,
      detail: `${warningItems[0]} sells below average. Pairing it with a top seller as a discounted combo can lift units without a standalone price cut.`,
      type: 'combo',
      impact: 'medium',
    })
  }

  // Promotion — only if there are star performers
  if (starItems.length > 0) {
    recs.push({
      title: `Promote ${starItems[0]} at peak hours`,
      detail: `${starItems[0]} has strong margins and above-average sales. A chalkboard feature during the morning rush can push volume further at no extra cost.`,
      type: 'promotion',
      impact: 'medium',
    })
  }

  // Removal — only if there are multiple low-margin items on a menu large enough to trim
  if (dangerItems.length > 1 && rows.length > 4) {
    recs.push({
      title: `Consider removing ${dangerItems[dangerItems.length - 1]}`,
      detail: `${dangerItems[dangerItems.length - 1]} has poor margins and ties up prep time. Removing it simplifies operations and lets staff focus on higher-value items.`,
      type: 'removal',
      impact: 'low',
    })
  }

  return recs
}

export async function getRecommendations(rows, flags) {
  if (!API_KEY) {
    await new Promise(r => setTimeout(r, 900))
    return mockRecommendations(rows, flags)
  }

  const tableText = rows
    .map((r) => `${r.item}: sold=${r.sold}/wk, price=₹${r.price}, cost=₹${r.cost}`)
    .join('\n')

  const flagText = [
    ...flags.danger.map((f) => `DANGER — ${f.row.item}: ${f.reason}`),
    ...flags.warning.map((f) => `WARNING — ${f.row.item}: ${f.reason}`),
    ...flags.success.map((f) => `STAR — ${f.row.item}: ${f.reason}`),
  ].join('\n') || 'No flags.'

  const prompt = `You are a revenue advisor for independent café owners in India.

Here is the weekly sales data (${rows.length} items):
${tableText}

Rule-engine flags:
${flagText}

Return ONLY the recommendations that are genuinely warranted by this specific data. Do not pad to a fixed number.
Rules:
- "removal" is only valid if the menu has more than 4 items AND there is a clear underperformer
- "combo" is only valid if there is a slow mover to bundle
- "pricing" is only valid if there are margin issues
- "promotion" is only valid if there is a star performer worth pushing
- Return between 1 and 4 recommendations — whatever the data actually supports

Each object must have:
- title: string (short, max 8 words, mention the specific item by name)
- detail: string (1–2 sentences, specific and practical, use actual numbers from the data)
- type: one of "pricing" | "removal" | "combo" | "promotion"
- impact: one of "high" | "medium" | "low"

Respond with only valid JSON array — no markdown, no explanation.
[{"title":"...","detail":"...","type":"pricing","impact":"high"},...]`

  const FREE_MODELS = [
    'deepseek/deepseek-v4-flash:free',
    'google/gemma-4-26b-a4b-it:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'openai/gpt-oss-20b:free',
    'qwen/qwen3-coder:free',
  ]

  let lastError = null
  let text = ''

  for (const model of FREE_MODELS) {
    let response
    try {
      response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
        }),
      })
    } catch (e) {
      lastError = e
      continue
    }

    if (!response.ok) {
      const err = await response.text()
      console.warn(`Model ${model} failed (${response.status}), trying next…`)
      lastError = new Error(`OpenRouter error ${response.status}: ${err}`)
      continue
    }

    const data = await response.json()
    text = data.choices?.[0]?.message?.content ?? ''
    if (text) break
  }

  if (!text) throw lastError ?? new Error('All models failed')

  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse recommendations from response')
  }
}
