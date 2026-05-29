// margin as a fraction 0–1
export function margin(row) {
  if (row.price === 0) return 0;
  return (row.price - row.cost) / row.price;
}

export function marginPct(row) {
  return Math.round(margin(row) * 100);
}

// Returns { danger: [], warning: [], success: [] } — each entry is { row, reason }
export function runRules(rows) {
  const flags = { danger: [], warning: [], success: [] };
  if (!rows.length) return flags;

  const avgSold = rows.reduce((s, r) => s + r.sold, 0) / rows.length;

  for (const row of rows) {
    const m = margin(row);

    if (m < 0.25) {
      flags.danger.push({ row, reason: `Margin ${marginPct(row)}% — below 25% threshold` });
    }

    if (row.sold < avgSold * 0.4) {
      flags.warning.push({ row, reason: `${row.sold} units/wk — slow mover (avg ${Math.round(avgSold)})` });
    }

    if (m > 0.55 && row.sold > avgSold) {
      flags.success.push({ row, reason: `Star: ${marginPct(row)}% margin, ${row.sold} units/wk above avg` });
    }
  }

  return flags;
}

export function flagCount(flags) {
  return flags.danger.length + flags.warning.length + flags.success.length;
}
