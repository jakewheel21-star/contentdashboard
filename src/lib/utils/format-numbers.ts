export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return n.toLocaleString()
}

export function formatPercent(n: number, decimals = 1): string {
  return n.toFixed(decimals) + '%'
}

export function formatDelta(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return sign + formatNumber(n)
}
