const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

const FREE_MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'openai/gpt-oss-20b:free',
  'qwen/qwen3-coder:free',
]

// Ask AI to map columns from any CSV to our required fields
async function inferMapping(headers, sampleRows) {
  const prompt = `You are a data analyst. I have a CSV file with these columns:
${headers.join(', ')}

Here are the first few rows of data:
${sampleRows.map(r => r.join(', ')).join('\n')}

Map this CSV to the fields our app needs:
- item: the name/title of the product being sold
- sold: units sold (could be a count column, or if this is transaction-level data where each row = 1 sale, set sold to null)
- price: the selling price per unit (revenue per item)
- cost: the cost/expense to make or buy the item
- date: transaction date (if available, for calculating weekly averages)
- format: "summary" if each row = one menu item with aggregated data, "transaction" if each row = one individual sale

Respond ONLY with valid JSON, no markdown:
{
  "format": "summary" or "transaction",
  "item_col": "exact column name or null",
  "sold_col": "exact column name or null",
  "price_col": "exact column name or null",
  "cost_col": "exact column name or null",
  "date_col": "exact column name or null",
  "notes": "one sentence explaining what you found"
}`

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 300,
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content ?? ''
      const match = text.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    } catch {
      continue
    }
  }
  return null
}

// Heuristic fallback — tries common column name patterns
function heuristicMapping(headers) {
  const lower = headers.map(h => h.toLowerCase().trim())

  const find = (patterns) => {
    const i = lower.findIndex(h => patterns.some(p => h.includes(p)))
    return i !== -1 ? headers[i] : null
  }

  const item  = find(['name', 'item', 'product', 'coffee', 'dish', 'title', 'description'])
  const sold  = find(['sold', 'units', 'qty', 'quantity', 'count', 'sales'])
  const price = find(['price', 'money', 'amount', 'rate', 'revenue', 'total', 'value', 'mrp', 'sp'])
  const cost  = find(['cost', 'cogs', 'expense', 'buying', 'purchase', 'cp'])
  const date  = find(['date', 'time', 'day', 'week', 'month'])

  const format = sold ? 'summary' : 'transaction'
  return { format, item_col: item, sold_col: sold, price_col: price, cost_col: cost, date_col: date }
}

function colIdx(headers, name) {
  if (!name) return -1
  return headers.findIndex(h => h.trim() === name.trim())
}

function aggregateTransactions(dataLines, headers, mapping) {
  const itemIdx  = colIdx(headers, mapping.item_col)
  const priceIdx = colIdx(headers, mapping.price_col)
  const dateIdx  = colIdx(headers, mapping.date_col)

  if (itemIdx === -1) return { rows: [], weeks: 1 }

  const map = {}
  const dates = []

  for (const line of dataLines) {
    const cols = line.split(',').map(c => c.trim().replace(/^₹/, ''))
    const item  = cols[itemIdx]
    const price = priceIdx !== -1 ? parseFloat(cols[priceIdx]) : NaN
    const date  = dateIdx  !== -1 ? new Date(cols[dateIdx])    : null

    if (!item) continue
    if (!map[item]) map[item] = { total: 0, count: 0 }
    map[item].count++
    if (!isNaN(price)) map[item].total += price
    if (date && !isNaN(date)) dates.push(date)
  }

  let weeks = 1
  if (dates.length >= 2) {
    const span = (Math.max(...dates) - Math.min(...dates)) / (1000 * 60 * 60 * 24)
    weeks = Math.max(1, Math.round(span / 7))
  }

  const rows = Object.entries(map)
    .filter(([, { count }]) => count > 0)
    .map(([item, { total, count }]) => ({
      id:    crypto.randomUUID(),
      item,
      sold:  Math.round(count / weeks),
      price: total > 0 ? Math.round(total / count) : 0,
      cost:  0,
    }))

  return { rows, weeks }
}

function parseSummary(dataLines, headers, mapping) {
  const itemIdx  = colIdx(headers, mapping.item_col)
  const soldIdx  = colIdx(headers, mapping.sold_col)
  const priceIdx = colIdx(headers, mapping.price_col)
  const costIdx  = colIdx(headers, mapping.cost_col)

  // Positional fallback
  const iIdx = itemIdx  !== -1 ? itemIdx  : 0
  const sIdx = soldIdx  !== -1 ? soldIdx  : 1
  const pIdx = priceIdx !== -1 ? priceIdx : 2
  const cIdx = costIdx  !== -1 ? costIdx  : 3

  const rows = []
  for (const line of dataLines) {
    const cols = line.split(',').map(c => c.trim().replace(/^₹/, ''))
    const item  = cols[iIdx] ?? ''
    const sold  = parseFloat(cols[sIdx])
    const price = parseFloat(cols[pIdx])
    const cost  = parseFloat(cols[cIdx])
    if (!item || isNaN(sold) || isNaN(price)) continue
    rows.push({ id: crypto.randomUUID(), item, sold, price, cost: isNaN(cost) ? 0 : cost })
  }
  return rows
}

// Main export — uses AI if available, heuristic fallback otherwise
export async function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { rows: [], warning: null }

  const headers   = lines[0].split(',').map(h => h.trim())
  const dataLines = lines.slice(1).filter(l => l.trim())
  const sampleRows = dataLines.slice(0, 5).map(l => l.split(',').map(c => c.trim()))

  // Try AI mapping, fall back to heuristic
  let mapping = null
  let usedAI  = false

  if (API_KEY) {
    mapping = await inferMapping(headers, sampleRows)
    if (mapping) usedAI = true
  }

  if (!mapping) {
    mapping = heuristicMapping(headers)
  }

  const isTransaction = mapping.format === 'transaction' || !mapping.sold_col

  if (isTransaction) {
    const { rows, weeks } = aggregateTransactions(dataLines, headers, mapping)
    const costMissing = !mapping.cost_col
    return {
      rows,
      isTransaction: true,
      weeks,
      usedAI,
      warning: costMissing
        ? `Aggregated ${rows.length} items over ~${weeks} week${weeks !== 1 ? 's' : ''} from transaction data. Cost column not found — please fill it in before analysing.`
        : null,
      notes: mapping.notes ?? null,
    }
  }

  const rows = parseSummary(dataLines, headers, mapping)
  const costMissing = !mapping.cost_col
  return {
    rows,
    isTransaction: false,
    usedAI,
    warning: costMissing ? 'Cost column not found in your CSV — please fill it in before analysing.' : null,
    notes: mapping.notes ?? null,
  }
}
