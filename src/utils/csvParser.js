// Parses a CSV string with columns: item, sold, price, cost
// Returns an array of row objects ready for the DataTable.
export function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip header row
    if (/^item/i.test(trimmed)) continue;

    const cols = trimmed.split(',').map((c) => c.trim().replace(/^₹/, ''));
    if (cols.length < 4) continue;

    const [item, sold, price, cost] = cols;
    const soldNum = parseFloat(sold);
    const priceNum = parseFloat(price);
    const costNum = parseFloat(cost);

    if (!item || isNaN(soldNum) || isNaN(priceNum) || isNaN(costNum)) continue;

    rows.push({
      id: crypto.randomUUID(),
      item,
      sold: soldNum,
      price: priceNum,
      cost: costNum,
    });
  }

  return rows;
}
