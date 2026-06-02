const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

const FREE_MODELS = [
  'deepseek/deepseek-v4-flash:free',
  'google/gemma-4-26b-a4b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'openai/gpt-oss-20b:free',
  'qwen/qwen3-coder:free',
]

// Properly parse a single CSV line — handles quoted fields with commas inside
function parseCSVLine(line) {
  const cols = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur.trim().replace(/^₹/, ''))
      cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur.trim().replace(/^₹/, ''))
  return cols
}

// Case-insensitive column index lookup
function colIdx(headers, name) {
  if (!name) return -1
  const lower = name.trim().toLowerCase()
  return headers.findIndex(h => h.trim().toLowerCase() === lower)
}

// Ask AI to identify which columns map to our required fields
async function inferMapping(headers, sampleRows) {
  const prompt = `You are a data analyst. I have a CSV with these columns:
${headers.join(', ')}

Sample rows:
${sampleRows.map(r => r.join(', ')).join('\n')}

Identify the best column for each field. Use the EXACT column name as it appears above.
- item_col: which column contains the product/item name?
- price_col: which column contains the price or sale amount per transaction?
- sold_col: which column contains units sold count? (null if each row is one sale)
- cost_col: which column contains cost/expense? (null if not present)
- date_col: which column contains the date? (null if not present)
- format: "transaction" if each row = 1 sale, "summary" if each row = 1 product with totals

Respond ONLY with JSON, no markdown, no explanation:
{"format":"transaction","item_col":"exact_name","price_col":"exact_name","sold_col":null,"cost_col":null,"date_col":"exact_name"}`

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
          max_tokens: 200,
        }),
      })
      if (!res.ok) continue
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content ?? ''
      const match = text.match(/\{[\s\S]*?\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        // Validate that at least item_col and price_col are present
        if (parsed.item_col && parsed.price_col) return parsed
      }
    } catch {
      continue
    }
  }
  return null
}

// Heuristic fallback — keyword matching on header names
function heuristicMapping(headers) {
  const lower = headers.map(h => h.toLowerCase().trim())

  const find = (...patterns) => {
    const i = lower.findIndex(h => patterns.some(p => h.includes(p)))
    return i !== -1 ? headers[i] : null
  }

  const item  = find('coffee', 'item', 'product', 'name', 'dish', 'title', 'description', 'menu')
  const price = find('money', 'price', 'amount', 'rate', 'revenue', 'total', 'value', 'sale', 'mrp')
  const sold  = find('sold', 'units', 'qty', 'quantity', 'count')
  const cost  = find('cost', 'cogs', 'expense', 'buying', 'purchase')
  const date  = find('date', 'time', 'day')

  return {
    format:    sold ? 'summary' : 'transaction',
    item_col:  item,
    price_col: price,
    sold_col:  sold,
    cost_col:  cost,
    date_col:  date,
  }
}

function aggregateTransactions(dataLines, headers, mapping) {
  const itemIdx  = colIdx(headers, mapping.item_col)
  const priceIdx = colIdx(headers, mapping.price_col)
  const dateIdx  = colIdx(headers, mapping.date_col)

  if (itemIdx === -1) return { rows: [], weeks: 1 }

  const map   = {}
  const dates = []

  for (const line of dataLines) {
    if (!line.trim()) continue
    const cols = parseCSVLine(line)
    const item  = cols[itemIdx]?.trim()
    const money = priceIdx !== -1 ? parseFloat(cols[priceIdx]) : NaN
    const date  = dateIdx  !== -1 ? new Date(cols[dateIdx])    : null

    if (!item) continue
    if (!map[item]) map[item] = { total: 0, count: 0 }
    map[item].count++
    if (!isNaN(money)) map[item].total += money
    if (date && !isNaN(date.getTime())) dates.push(date)
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
      sold:  Math.max(1, Math.round(count / weeks)),
      price: total > 0 ? Math.round(total / count) : 0,
      cost:  0,
    }))

  return { rows, weeks }
}

function parseSummary(dataLines, headers, mapping) {
  const iIdx = colIdx(headers, mapping.item_col)  !== -1 ? colIdx(headers, mapping.item_col)  : 0
  const sIdx = colIdx(headers, mapping.sold_col)  !== -1 ? colIdx(headers, mapping.sold_col)  : 1
  const pIdx = colIdx(headers, mapping.price_col) !== -1 ? colIdx(headers, mapping.price_col) : 2
  const cIdx = colIdx(headers, mapping.cost_col)  !== -1 ? colIdx(headers, mapping.cost_col)  : 3

  const rows = []
  for (const line of dataLines) {
    if (!line.trim()) continue
    const cols = parseCSVLine(line)
    const item  = cols[iIdx]?.trim()
    const sold  = parseFloat(cols[sIdx])
    const price = parseFloat(cols[pIdx])
    const cost  = parseFloat(cols[cIdx])
    if (!item || isNaN(sold) || isNaN(price)) continue
    rows.push({ id: crypto.randomUUID(), item, sold, price, cost: isNaN(cost) ? 0 : cost })
  }
  return rows
}

export async function parseCSV(text) {
  const lines     = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { rows: [], warning: null }

  // Strip UTF-8 BOM if present
  const firstLine = lines[0].replace(/^﻿/, '')
  const headers   = parseCSVLine(firstLine)
  const dataLines = lines.slice(1)
  const sampleRows = dataLines.slice(0, 5).map(parseCSVLine)

  // 1. Try AI mapping
  let mapping = null
  if (API_KEY) mapping = await inferMapping(headers, sampleRows)

  // 2. Heuristic fallback
  if (!mapping || !mapping.item_col || !mapping.price_col) {
    mapping = heuristicMapping(headers)
  }

  const isTransaction = mapping.format === 'transaction' || !mapping.sold_col

  // 3. Parse
  let rows, weeks
  if (isTransaction) {
    ({ rows, weeks } = aggregateTransactions(dataLines, headers, mapping))
  } else {
    rows  = parseSummary(dataLines, headers, mapping)
    weeks = null
  }

  // 4. If still empty, try positional as last resort
  if (rows.length === 0) {
    mapping = { format: 'summary', item_col: headers[0], sold_col: headers[1], price_col: headers[2], cost_col: headers[3] }
    rows = parseSummary(dataLines, headers, mapping)
  }

  const costMissing = !mapping.cost_col || rows.every(r => r.cost === 0)
  const warning = costMissing && rows.length > 0
    ? `Cost column not found — all costs set to ₹0. Please fill them in before analysing.`
    : null

  const weekNote = isTransaction && weeks
    ? `Detected transaction data — ${rows.length} items aggregated over ~${weeks} week${weeks !== 1 ? 's' : ''}. ${warning ?? ''}`
    : warning

  return { rows, isTransaction, weeks, warning: weekNote }
}
