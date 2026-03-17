import type { Item, Artist, Sale, Session, ConsignmentSession, ConsignmentItem } from '~/composables/useDatabase'

function formatCurrency(amount: number, currency: 'IDR' | 'SGD'): string {
  if (currency === 'IDR') return 'Rp' + amount.toLocaleString('id-ID')
  return '$' + amount.toFixed(2)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── POS CSV Export ────────────────────────────────────────────────────────

export function exportPosCSV(params: {
  session: Session
  sales: Sale[]
  items: Item[]
  artists: Artist[]
}) {
  const { session, sales, items, artists } = params
  const currency = session.currency
  const activeSales = sales.filter(s => s.quantity > 0)

  const rows = [
    ['Code', 'Name', 'Artist', 'Category', 'Qty', 'Price', 'Cost', 'Revenue', 'Total Cost', 'Profit', 'Margin%'],
  ]

  for (const sale of activeSales) {
    const item = items.find(i => i.code === sale.itemCode)
    if (!item) continue
    const artist = artists.find(a => a.id === item.artistId)
    const price = sale.customPrice ?? (currency === 'IDR' ? item.priceIDR : item.priceSGD)
    const cost = sale.customCost ?? (currency === 'IDR' ? item.costIDR : item.costSGD)
    const share = artist?.revenueShare ?? 1
    const revenue = price * sale.quantity
    const totalCost = cost * sale.quantity * share
    const profit = revenue - totalCost
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0'

    rows.push([
      item.code,
      sale.customTitle ?? item.name,
      artist?.name ?? '?',
      item.category,
      String(sale.quantity),
      String(price),
      String(cost),
      String(revenue),
      String(totalCost.toFixed(2)),
      String(profit.toFixed(2)),
      margin + '%',
    ])
  }

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const dateStr = session.date.replace(/-/g, '')
  downloadBlob(blob, `${session.name.replace(/\s+/g, '_')}_${dateStr}.csv`)
}

// ─── POS HTML Report ───────────────────────────────────────────────────────

export function generatePosReportHTML(params: {
  session: Session
  sales: Sale[]
  items: Item[]
  artists: Artist[]
}): string {
  const { session, sales, items, artists } = params
  const currency = session.currency
  const activeSales = sales.filter(s => s.quantity > 0)

  let totalRevenue = 0
  let totalCost = 0
  let totalUnits = 0

  const rows = activeSales.map(sale => {
    const item = items.find(i => i.code === sale.itemCode)
    if (!item) return ''
    const artist = artists.find(a => a.id === item.artistId)
    const price = sale.customPrice ?? (currency === 'IDR' ? item.priceIDR : item.priceSGD)
    const cost = sale.customCost ?? (currency === 'IDR' ? item.costIDR : item.costSGD)
    const share = artist?.revenueShare ?? 1
    const revenue = price * sale.quantity
    const itemCost = cost * sale.quantity * share
    const profit = revenue - itemCost

    totalRevenue += revenue
    totalCost += itemCost
    totalUnits += sale.quantity

    return `<tr>
      <td>${item.code}</td>
      <td>${sale.customTitle ?? item.name}</td>
      <td>${artist?.name ?? '?'}</td>
      <td>${item.category}</td>
      <td class="num">${sale.quantity}</td>
      <td class="num">${formatCurrency(price, currency)}</td>
      <td class="num">${formatCurrency(revenue, currency)}</td>
      <td class="num ${profit >= 0 ? 'pos' : 'neg'}">${formatCurrency(profit, currency)}</td>
    </tr>`
  }).join('')

  const totalProfit = totalRevenue - totalCost
  const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${session.name} Report</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
  .report { max-width: 1000px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,.1); }
  h1 { margin: 0 0 4px; font-size: 1.5rem; color: #7c3aed; }
  .meta { color: #64748b; font-size: .9rem; margin-bottom: 24px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat { background: #f1f5f9; border-radius: 8px; padding: 16px; }
  .stat-label { font-size: .75rem; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
  table { width: 100%; border-collapse: collapse; font-size: .875rem; }
  th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  .num { text-align: right; }
  .pos { color: #16a34a; font-weight: 600; }
  .neg { color: #dc2626; font-weight: 600; }
  tfoot td { font-weight: 700; border-top: 2px solid #e2e8f0; }
  @media print { body { background: white; } .report { box-shadow: none; } }
</style>
</head>
<body>
<div class="report">
  <h1>${session.name}</h1>
  <div class="meta">${session.date} · ${session.location} · ${currency}</div>
  <div class="summary">
    <div class="stat"><div class="stat-label">Total Revenue</div><div class="stat-value">${formatCurrency(totalRevenue, currency)}</div></div>
    <div class="stat"><div class="stat-label">Total Profit</div><div class="stat-value ${totalProfit >= 0 ? 'pos' : 'neg'}">${formatCurrency(totalProfit, currency)}</div></div>
    <div class="stat"><div class="stat-label">Margin</div><div class="stat-value">${margin}%</div></div>
    <div class="stat"><div class="stat-label">Units Sold</div><div class="stat-value">${totalUnits}</div></div>
  </div>
  <table>
    <thead><tr><th>Code</th><th>Name</th><th>Artist</th><th>Category</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Revenue</th><th class="num">Profit</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="4">TOTAL</td>
      <td class="num">${totalUnits}</td>
      <td></td>
      <td class="num">${formatCurrency(totalRevenue, currency)}</td>
      <td class="num ${totalProfit >= 0 ? 'pos' : 'neg'}">${formatCurrency(totalProfit, currency)}</td>
    </tr></tfoot>
  </table>
</div>
</body></html>`
}

export function exportPosPDF(params: Parameters<typeof generatePosReportHTML>[0]) {
  const html = generatePosReportHTML(params)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const dateStr = params.session.date.replace(/-/g, '')
  downloadBlob(blob, `${params.session.name.replace(/\s+/g, '_')}_${dateStr}_report.html`)
}

// ─── Consignment CSV Export ────────────────────────────────────────────────

export function exportConsignmentCSV(params: {
  session: ConsignmentSession
  items: ConsignmentItem[]
  calcItem: (item: ConsignmentItem) => Record<string, number>
}) {
  const { session, items, calcItem } = params
  const currency = session.currency

  const rows = [
    ['Item Code', 'Name', 'Event/Channel', 'Qty Consigned', 'Qty Sold', 'Selling Price', 'Printing Cost', 'Profit %', 'Gross Revenue', 'Printing Total', 'Fee Allocation', 'Net After Fees', 'Artist Payout', 'Platform Cut'],
  ]

  for (const item of items) {
    const c = calcItem(item)
    rows.push([
      item.itemCode,
      item.itemName,
      item.channel ?? '',
      String(item.quantityConsigned),
      String(item.quantitySold),
      formatCurrency(item.sellingPrice, currency),
      formatCurrency(item.printingCost, currency),
      item.profitSharePercent + '%',
      formatCurrency(c.grossRevenue, currency),
      formatCurrency(c.totalPrintingCost, currency),
      formatCurrency(c.feeAllocation, currency),
      formatCurrency(c.netAfterFees, currency),
      formatCurrency(c.artistPayout, currency),
      formatCurrency(c.platformCut, currency),
    ])
  }

  const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const dateStr = session.date.replace(/-/g, '')
  downloadBlob(blob, `Consignment_${session.name.replace(/\s+/g, '_')}_${dateStr}.csv`)
}

export function generateConsignmentReportHTML(params: {
  session: ConsignmentSession
  items: ConsignmentItem[]
  calcItem: (item: ConsignmentItem) => Record<string, number>
  totals: Record<string, number>
}): string {
  const { session, items, calcItem, totals } = params
  const currency = session.currency

  const rows = items.map(item => {
    const c = calcItem(item)
    return `<tr>
      <td>${item.itemName}</td>
      <td>${item.channel ?? '—'}</td>
      <td class="num">${item.quantityConsigned}</td>
      <td class="num">${item.quantitySold}</td>
      <td class="num">${formatCurrency(item.sellingPrice, currency)}</td>
      <td class="num">${formatCurrency(item.printingCost, currency)}</td>
      <td class="num">${item.profitSharePercent}%</td>
      <td class="num">${formatCurrency(c.grossRevenue, currency)}</td>
      <td class="num">${formatCurrency(c.netAfterFees, currency)}</td>
      <td class="num highlight">${formatCurrency(c.artistPayout, currency)}</td>
    </tr>`
  }).join('')

  const feesSection = session.fees.map(f =>
    `<div class="fee-row"><span>${f.name}</span><span>${f.type === 'fixed' ? formatCurrency(f.value, currency) : f.value + '%'}</span></div>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Consignment Report — ${session.name}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
  .report { max-width: 1100px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,.1); }
  h1 { margin: 0 0 4px; font-size: 1.5rem; color: #7c3aed; }
  .meta { color: #64748b; font-size: .9rem; margin-bottom: 24px; }
  .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .stat { background: #f1f5f9; border-radius: 8px; padding: 16px; }
  .stat-label { font-size: .75rem; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
  .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
  .stat-value.green { color: #16a34a; }
  .fees { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
  .fees h3 { margin: 0 0 12px; font-size: .875rem; color: #7c3aed; }
  .fee-row { display: flex; justify-content: space-between; font-size: .875rem; padding: 4px 0; border-bottom: 1px solid #f3e8ff; }
  table { width: 100%; border-collapse: collapse; font-size: .875rem; }
  th { text-align: left; padding: 10px 12px; background: #f8fafc; border-bottom: 2px solid #e2e8f0; color: #64748b; font-weight: 600; }
  td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  .num { text-align: right; }
  .highlight { color: #7c3aed; font-weight: 700; }
  tfoot td { font-weight: 700; border-top: 2px solid #e2e8f0; }
  .report-header { position: relative; margin-bottom: 24px; }
  .stamp-wrap { position: absolute; top: 4px; right: 0; }
  .stamp {
    display: inline-block;
    padding: 10px 18px;
    border: 4px solid currentColor;
    border-radius: 6px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 1.5rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    transform: rotate(-14deg);
    opacity: 0.82;
    line-height: 1;
  }
  .stamp-paid { color: #16a34a; }
  .stamp-pending { color: #d97706; }
  .stamp-draft { color: #94a3b8; }
  .stamp-sub { display: block; font-size: .5rem; letter-spacing: .12em; margin-top: 4px; text-align: center; font-weight: 700; }
  @media print { body { background: white; } .report { box-shadow: none; } }
</style>
</head>
<body>
<div class="report">
  <div class="report-header">
    <h1>Consignment Report — ${session.name}</h1>
    <div class="meta">${session.date}${session.platform ? ' · ' + session.platform : ''} · ${currency}</div>
    <div class="stamp-wrap">
      ${session.status === 'paid'
        ? `<div class="stamp stamp-paid">✓ Paid<span class="stamp-sub">${session.paidAt ?? ''}</span></div>`
        : session.status === 'pending'
        ? `<div class="stamp stamp-pending">Pending<span class="stamp-sub">awaiting payment</span></div>`
        : `<div class="stamp stamp-draft">Draft<span class="stamp-sub">not finalised</span></div>`
      }
    </div>
  </div>

  <div class="summary">
    <div class="stat"><div class="stat-label">Gross Revenue</div><div class="stat-value">${formatCurrency(totals.grossRevenue ?? 0, currency)}</div></div>
    <div class="stat"><div class="stat-label">Printing Costs</div><div class="stat-value">${formatCurrency(totals.totalPrintingCost ?? 0, currency)}</div></div>
    <div class="stat"><div class="stat-label">Total Fees</div><div class="stat-value">${formatCurrency(totals.totalFees ?? 0, currency)}</div></div>
    <div class="stat">
    <div class="stat-label">Artist Payout</div>
    <div class="stat-value green">${formatCurrency(totals.totalArtistPayout ?? 0, currency)}</div>
    ${session.kursRate && session.kursCurrency ? (() => {
      const sym: Record<string, string> = { USD: '$', KRW: '₩', EUR: '€', SGD: 'S$' }
      const converted = (totals.totalArtistPayout ?? 0) / session.kursRate
      return `<div style="font-size:.8rem;color:#d97706;margin-top:4px;">≈ ${sym[session.kursCurrency] ?? ''}${converted.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})} ${session.kursCurrency}<br><span style="font-size:.7rem;color:#94a3b8;">@ Rp${session.kursRate.toLocaleString('id-ID')} / 1 ${session.kursCurrency}</span></div>`
    })() : ''}
    ${session.payVia ? `<div style="font-size:.75rem;color:#64748b;margin-top:4px;">via ${session.payVia}</div>` : ''}
  </div>
  </div>

  ${session.fees.length > 0 ? `<div class="fees"><h3>Applied Fees</h3>${feesSection}</div>` : ''}

  <table>
    <thead><tr>
      <th>Product</th><th>Event/Channel</th><th class="num">Consigned</th><th class="num">Sold</th>
      <th class="num">Price</th><th class="num">Print Cost</th><th class="num">Share%</th>
      <th class="num">Gross</th><th class="num">Net</th><th class="num">Payout</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td>TOTAL</td>
      <td></td>
      <td class="num">${items.reduce((s, i) => s + i.quantityConsigned, 0)}</td>
      <td class="num">${totals.totalUnits}</td>
      <td colspan="3"></td>
      <td class="num">${formatCurrency(totals.grossRevenue ?? 0, currency)}</td>
      <td class="num">${formatCurrency(totals.netAfterFees ?? 0, currency)}</td>
      <td class="num highlight">${formatCurrency(totals.totalArtistPayout ?? 0, currency)}</td>
    </tr></tfoot>
  </table>
</div>
</body></html>`
}

export function exportConsignmentPDF(params: Parameters<typeof generateConsignmentReportHTML>[0]) {
  const html = generateConsignmentReportHTML(params)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const dateStr = params.session.date.replace(/-/g, '')
  downloadBlob(blob, `Consignment_${params.session.name.replace(/\s+/g, '_')}_${dateStr}_report.html`)
}

// ─── Composable wrapper for Nuxt auto-import ──────────────────────────────────

export function useExport() {
  return {
    exportPosCSV,
    exportPosPDF,
    generatePosReportHTML,
    exportConsignmentCSV,
    exportConsignmentPDF,
    generateConsignmentReportHTML,
  }
}
