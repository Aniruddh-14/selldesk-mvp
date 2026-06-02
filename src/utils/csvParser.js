// Aliases for each field — matches common column name variations
const ALIASES = {
  item:  ['item', 'name', 'product', 'product name', 'menu item', 'description', 'dish', 'title'],
  sold:  ['sold', 'units', 'qty', 'quantity', 'units sold', 'sales', 'weekly sales', 'weekly units', 'count'],
  price: ['price', 'rate', 'selling price', 'sell price', 'mrp', 'sp', 'sale price', 'amount'],
  cost:  ['cost', 'cogs', 'cost price', 'buying price', 'purchase price', 'cp', 'expense'],
}

function findColIndex(headers, field) {
  const aliases = ALIASES[field]
  return headers.findIndex(h => aliases.includes(h.toLowerCase().trim()))
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return []

  // Detect if first line is a header by checking if it contains known column names
  const firstCols = lines[0].split(',').map(c => c.trim().toLowerCase())
  const hasHeader = ALIASES.item.some(a => firstCols.includes(a)) ||
                    ALIASES.sold.some(a => firstCols.includes(a))

  let itemIdx, soldIdx, priceIdx, costIdx
  let dataLines

  if (hasHeader) {
    const headers = lines[0].split(',')
    itemIdx  = findColIndex(headers, 'item')
    soldIdx  = findColIndex(headers, 'sold')
    priceIdx = findColIndex(headers, 'price')
    costIdx  = findColIndex(headers, 'cost')
    dataLines = lines.slice(1)
  } else {
    // Fall back to positional order: item, sold, price, cost
    itemIdx = 0; soldIdx = 1; priceIdx = 2; costIdx = 3
    dataLines = lines
  }

  // If any required column is missing, try positional anyway
  if (itemIdx === -1 || soldIdx === -1 || priceIdx === -1 || costIdx === -1) {
    itemIdx = 0; soldIdx = 1; priceIdx = 2; costIdx = 3
  }

  const rows = []

  for (const line of dataLines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const cols = trimmed.split(',').map(c => c.trim().replace(/^₹/, '').replace(/,/g, ''))

    const item  = cols[itemIdx]  ?? ''
    const sold  = parseFloat(cols[soldIdx])
    const price = parseFloat(cols[priceIdx])
    const cost  = parseFloat(cols[costIdx])

    if (!item || isNaN(sold) || isNaN(price) || isNaN(cost)) continue

    rows.push({ id: crypto.randomUUID(), item, sold, price, cost })
  }

  return rows
}
