const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

function mockRecommendations(rows, flags) {
  const dangerItems  = flags.danger.map(f => f.row.item);
  const warningItems = flags.warning.map(f => f.row.item);
  const starItems    = flags.success.map(f => f.row.item);

  return [
    {
      title: dangerItems.length
        ? `Reprice ${dangerItems[0]} to hit 30% margin`
        : 'Review pricing on low-margin items',
      detail: dangerItems.length
        ? `${dangerItems[0]} is currently below the 25% margin floor. A modest ₹10–15 price increase is unlikely to affect demand and immediately improves profitability.`
        : 'Audit each item against your target margin and adjust prices before the next week.',
      type: 'pricing',
      impact: 'high',
    },
    {
      title: warningItems.length
        ? `Bundle ${warningItems[0]} with a bestseller`
        : 'Create a combo with slow movers',
      detail: warningItems.length
        ? `${warningItems[0]} sells significantly below average. Pairing it with a top seller as a discounted combo can lift its weekly units without a standalone price cut.`
        : 'Bundle slow-moving items with your top sellers at a slight discount to move inventory and increase average order value.',
      type: 'combo',
      impact: 'medium',
    },
    {
      title: starItems.length
        ? `Promote ${starItems[0]} at peak hours`
        : 'Feature high-margin items on the board',
      detail: starItems.length
        ? `${starItems[0]} has both strong margins and above-average sales. A chalkboard feature or staff recommendation during the morning rush can push volume further at no extra cost.`
        : 'Place your highest-margin items at eye level on your menu board and train staff to upsell them during busy periods.',
      type: 'promotion',
      impact: 'medium',
    },
    {
      title: dangerItems.length > 1
        ? `Consider removing ${dangerItems[dangerItems.length - 1]}`
        : 'Trim the bottom two performers',
      detail: dangerItems.length > 1
        ? `${dangerItems[dangerItems.length - 1]} has poor margins and likely ties up prep time. Removing it simplifies operations and lets staff focus on higher-value items.`
        : 'A shorter menu reduces waste, speeds up service, and concentrates customer attention on your most profitable items.',
      type: 'removal',
      impact: 'low',
    },
  ];
}

export async function getRecommendations(rows, flags) {
  if (!API_KEY) {
    await new Promise(r => setTimeout(r, 900));
    return mockRecommendations(rows, flags);
  }

  const tableText = rows
    .map((r) => `${r.item}: sold=${r.sold}/wk, price=₹${r.price}, cost=₹${r.cost}`)
    .join('\n');

  const flagText = [
    ...flags.danger.map((f) => `DANGER — ${f.row.item}: ${f.reason}`),
    ...flags.warning.map((f) => `WARNING — ${f.row.item}: ${f.reason}`),
    ...flags.success.map((f) => `STAR — ${f.row.item}: ${f.reason}`),
  ].join('\n') || 'No flags.';

  const prompt = `You are a revenue advisor for independent café owners in India.

Here is the weekly sales data:
${tableText}

Rule-engine flags:
${flagText}

Return exactly 4 actionable recommendations as a JSON array. Each object must have:
- title: string (short, max 8 words)
- detail: string (1–2 sentences, specific and practical)
- type: one of "pricing" | "removal" | "combo" | "promotion"
- impact: one of "high" | "medium" | "low"

Respond with only valid JSON — no markdown, no explanation. Example format:
[{"title":"...","detail":"...","type":"pricing","impact":"high"},...]`;

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
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) return JSON.parse(match[0]);
    throw new Error('Could not parse recommendations from response');
  }
}
