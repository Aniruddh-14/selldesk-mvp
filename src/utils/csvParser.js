// Aliases for summary-format CSVs (item, sold, price, cost)
const ALIASES = {
  item:  ['item', 'name', 'product', 'product name', 'menu item', 'description', 'dish', 'title'],
  sold:  ['sold', 'units', 'qty', 'quantity', 'units sold', 'sales', 'weekly sales', 'weekly units', 'count'],
  price: ['price', 'rate', 'selling price', 'sell price', 'mrp', 'sp', 'sale price', 'amount'],
  cost:  ['cost', 'cogs', 'cost price', 'buying price', 'purchase price', 'cp', 'expense'],
}

// Aliases for transaction-format CSVs (one row per sale)
const TX_ALIASES = {
  item:  ['coffee_name', 'item', 'name', 'product', 'product_name', 'menu_item', 'dish', 'title', 'description'],
  money: ['money', 'amount', 'price', 'total', 'revenue', 'sale_amount', 'value'],
  date:  ['date', 'transaction_date', 'sale_date', 'order_date', 'datetime'],
}

function findColIndex(headers, field) {
  const aliases = ALIASES[field]
  return headers.findIndex(h => aliases.includes(h.toLowerCase().trim()))
}

function findTxIndex(headers, field) {
  const aliases = TX_ALIASES[field]
  return headers.findIndex(h => aliases.includes(h.toLowerCase().trim()))
}

function isTransactionFormat(headers) {
  const lower = headers.map(h => h.toLowerCase().trim())
  return TX_ALIASES.item.some(a => lower.includes(a)) &&
         TX_ALIASES.money.some(a => lower.includes(a)) &&
         !ALIASES.sold.some(a => lower.includes(a))
}

function parseTransactionCSV(lines, headers) {
  const itemIdx  = findTxIndex(headers, 'item')
  const moneyIdx = findTxIndex(headers, 'money')
  const dateIdx  = findTxIndex(headers, 'date')

  if (itemIdx === -1 || moneyIdx === -1) return { rows: [], isTransaction: true }

  const txMap = {}   // item -> { total_money, count }
  const dates = []

  for (const line of lines.slice(1)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const cols = trimmed.split(',').map(c => c.trim().replace(/^₹/, ''))

    const item  = cols[itemIdx]
    const money = parseFloat(cols[moneyIdx])
    const date  = dateIdx !== -1 ? cols[dateIdx] : null

    if (!item || isNaN(money)) continue

    if (!txMap[item]) txMap[item] = { total: 0, count: 0 }
    txMap[item].total += money
    txMap[item].count += 1

    if (date) {
      const d = new Date(date)
      if (!isNaN(d)) dates.push(d)
    }
  }

  // Calculate number of weeks in the dataset
  let weeks = 1
  if (dates.length >= 2) {
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))
    const daySpan = (maxDate - minDate) / (1000 * 60 * 60 * 24)
    weeks = Math.max(1, Math.round(daySpan / 7))
  }

  const rows = Object.entries(txMap).map(([item, { total, count }]) => ({
    id:    crypto.randomUUID(),
    item,
    sold:  Math.round(count / weeks),
    price: Math.round(total / count),
    cost:  0,
  }))

  return { rows, isTransaction: true, weeks }
}

export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length === 0) return { rows: [] }

  const headers = lines[0].split(',')

  // Detect transaction-style CSV
  if (isTransactionFormat(headers)) {
    return parseTransactionCSV(lines, headers)
  }

  // Summary-style CSV
  const firstCols = headers.map(c => c.trim().toLowerCase())
  const hasHeader = ALIASES.item.some(a => firstCols.includes(a)) ||
                    ALIASES.sold.some(a => firstCols.includes(a))

  let itemIdx, soldIdx, priceIdx, costIdx, dataLines

  if (hasHeader) {
    itemIdx  = findColIndex(headers, 'item')
    soldIdx  = findColIndex(headers, 'sold')
    priceIdx = findColIndex(headers, 'price')
    costIdx  = findColIndex(headers, 'cost')
    dataLines = lines.slice(1)
  } else {
    itemIdx = 0; soldIdx = 1; priceIdx = 2; costIdx = 3
    dataLines = lines
  }

  if (itemIdx === -1 || soldIdx === -1 || priceIdx === -1 || costIdx === -1) {
    itemIdx = 0; soldIdx = 1; priceIdx = 2; costIdx = 3
  }

  const rows = []
  for (const line of dataLines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const cols = trimmed.split(',').map(c => c.trim().replace(/^₹/, ''))
    const item  = cols[itemIdx] ?? ''
    const sold  = parseFloat(cols[soldIdx])
    const price = parseFloat(cols[priceIdx])
    const cost  = parseFloat(cols[costIdx])
    if (!item || isNaN(sold) || isNaN(price) || isNaN(cost)) continue
    rows.push({ id: crypto.randomUUID(), item, sold, price, cost })
  }

  return { rows, isTransaction: false }
}
