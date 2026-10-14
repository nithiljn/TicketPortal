import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { Expense } from '@/types'

export interface ExpensePdfPayload {
  expenses: Expense[]
  activeMonth: string
  selectedProject: string
  activeCategory: string
  activePaymentMethod: string
  minAmount?: string
  maxAmount?: string
  searchQuery?: string
  stats: {
    totalAmount: number
    count: number
    todayAmount: number
    topCategory: string
    topCategoryAmount: number
    topCategoryPercent: number
    highestSingle: number
    highestTitle: string
    dailyAverage: number
    categoryTotals: Record<string, number>
  }
  categoryBreakdown: {
    category: string
    amount: number
    percentage: number
    color: string
  }[]
  dailyTrend: {
    date: string
    displayDate: string
    amount: number
    percentage: number
  }[]
}

// Convert hex color code to RGB triplet
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    return [r, g, b]
  }
  const num = parseInt(clean, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function formatInr(val: number): string {
  return `Rs. ${val.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function sanitizeText(str: string): string {
  if (!str) return ''
  return str.replace(/₹/g, 'Rs. ')
}

function formatPaymentMethod(method?: string): string {
  if (!method) return 'Other'
  const m = method.toUpperCase()
  switch (m) {
    case 'UPI':
      return 'UPI'
    case 'CASH':
      return 'Cash'
    case 'NET_BANKING':
      return 'Net Banking'
    case 'CREDIT_CARD':
      return 'Credit Card'
    case 'DEBIT_CARD':
      return 'Debit Card'
    case 'OTHER':
      return 'Other'
    default:
      return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase().replace(/_/g, ' ')
  }
}

function formatMonthLabel(mKey: string): string {
  if (mKey === 'ALL') return 'All Time'
  const parts = mKey.split('-')
  if (parts.length < 2) return mKey
  const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
  return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

// Draw authentic vector Ticket silhouette with side notches and perforation
function drawTicketIcon(doc: jsPDF, x: number, y: number, size: number): void {
  const s = size / 24
  const sx = (px: number) => x + px * s
  const sy = (py: number) => y + py * s
  const k2 = 2 * 0.55228475
  const k3 = 3 * 0.55228475

  const path = [
    { op: 'm', c: [sx(2), sy(9)] },
    { op: 'l', c: [sx(2), sy(7)] },
    { op: 'c', c: [sx(2), sy(7 - k2), sx(4 - k2), sy(5), sx(4), sy(5)] },
    { op: 'l', c: [sx(20), sy(5)] },
    { op: 'c', c: [sx(20 + k2), sy(5), sx(22), sy(7 - k2), sx(22), sy(7)] },
    { op: 'l', c: [sx(22), sy(9)] },
    { op: 'c', c: [sx(22 - k3), sy(9), sx(19), sy(12 - k3), sx(19), sy(12)] },
    { op: 'c', c: [sx(19), sy(12 + k3), sx(22 - k3), sy(15), sx(22), sy(15)] },
    { op: 'l', c: [sx(22), sy(17)] },
    { op: 'c', c: [sx(22), sy(17 + k2), sx(20 + k2), sy(19), sx(20), sy(19)] },
    { op: 'l', c: [sx(4), sy(19)] },
    { op: 'c', c: [sx(4 - k2), sy(19), sx(2), sy(17 + k2), sx(2), sy(17)] },
    { op: 'l', c: [sx(2), sy(15)] },
    { op: 'c', c: [sx(2 + k3), sy(15), sx(5), sy(12 + k3), sx(5), sy(12)] },
    { op: 'c', c: [sx(5), sy(12 - k3), sx(2 + k3), sy(9), sx(2), sy(9)] },
    { op: 'h', c: [] },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(doc as any).path(path)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(doc as any).stroke()

  doc.line(sx(13), sy(5.5), sx(13), sy(7.5))
  doc.line(sx(13), sy(11), sx(13), sy(13))
  doc.line(sx(13), sy(16.5), sx(13), sy(18.5))
}

export function generateExpensePdf(payload: ExpensePdfPayload): void {
  const {
    expenses,
    activeMonth,
    selectedProject,
    activeCategory,
    activePaymentMethod,
    minAmount,
    maxAmount,
    searchQuery,
    stats,
    categoryBreakdown,
    dailyTrend,
  } = payload

  // Create standard A4 portrait document (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const pageHeight = 297
  const marginX = 14
  const contentWidth = pageWidth - marginX * 2 // 182mm

  let curY = 12

  // Squircle Logo Background
  doc.setFillColor(18, 18, 21)
  doc.setDrawColor(39, 39, 42)
  doc.setLineWidth(0.3)
  doc.roundedRect(marginX, curY, 11, 11, 2.5, 2.5, 'FD')

  // Centered Vector Ticket Icon inside Squircle
  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.35)
  drawTicketIcon(doc, marginX + 1.9, curY + 1.9, 7.2)

  // Application Title & Subtitle
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(17, 24, 39)
  doc.text('TicketFlow', marginX + 14, curY + 5)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(107, 114, 128)
  doc.text('Expense Report & Financial Summary', marginX + 14, curY + 9.5)

  // Right Header Info
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(75, 85, 99)
  doc.text(`Generated: ${dateStr} • ${timeStr}`, pageWidth - marginX, curY + 4.5, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  doc.setTextColor(16, 185, 129)
  doc.text(`${stats.count} Transactions • Verified`, pageWidth - marginX, curY + 9, { align: 'right' })

  curY += 14

  // Thin Separator
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.25)
  doc.line(marginX, curY, pageWidth - marginX, curY)
  curY += 4

  // Applied Filters Bar
  const filterBoxH = 7.5
  doc.setFillColor(244, 244, 245)
  doc.setDrawColor(228, 228, 231)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, filterBoxH, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(113, 113, 122)
  doc.text('APPLIED FILTERS:', marginX + 3, curY + 4.8)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(24, 24, 27)

  const filterParts = [
    `Period: ${formatMonthLabel(activeMonth)}`,
    `Workspace: ${selectedProject === 'ALL' ? 'All Workspaces' : selectedProject}`,
    `Category: ${activeCategory === 'ALL' ? 'All Categories' : activeCategory}`,
    `Method: ${activePaymentMethod === 'ALL' ? 'All Methods' : activePaymentMethod}`,
  ]

  if (minAmount || maxAmount) {
    const range = `${minAmount ? 'Min Rs.' + minAmount : ''}${minAmount && maxAmount ? ' - ' : ''}${maxAmount ? 'Max Rs.' + maxAmount : ''}`
    filterParts.push(`Range: ${range}`)
  }

  if (searchQuery && searchQuery.trim()) {
    filterParts.push(`Search: "${sanitizeText(searchQuery.trim())}"`)
  }

  const filterText = filterParts.join('   |   ')
  doc.text(filterText, marginX + 28, curY + 4.8)

  curY += filterBoxH + 3.5

  // KPI Metric Cards (4 Columns)
  const cardGap = 3
  const cardW = (contentWidth - cardGap * 3) / 4
  const cardH = 14

  const metricCards = [
    {
      title: 'TOTAL FILTERED SPEND',
      value: formatInr(stats.totalAmount),
      sub: `${stats.count} total records`,
    },
    {
      title: 'TOP CATEGORY',
      value: stats.topCategory.length > 15 ? stats.topCategory.slice(0, 14) + '...' : stats.topCategory,
      sub: stats.totalAmount > 0 ? `${stats.topCategoryPercent}% of spend` : 'No data',
    },
    {
      title: 'HIGHEST TRANSACTION',
      value: formatInr(stats.highestSingle),
      sub: stats.highestTitle.length > 16 ? stats.highestTitle.slice(0, 15) + '...' : stats.highestTitle || 'None',
    },
    {
      title: 'DAILY AVERAGE SPEND',
      value: formatInr(stats.dailyAverage),
      sub: 'Computed by active days',
    },
  ]

  metricCards.forEach((c, idx) => {
    const cx = marginX + idx * (cardW + cardGap)
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.roundedRect(cx, curY, cardW, cardH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6)
    doc.setTextColor(113, 113, 122)
    doc.text(c.title, cx + 2.5, curY + 3.8)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(17, 24, 39)
    doc.text(c.value, cx + 2.5, curY + 8.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.8)
    doc.setTextColor(156, 163, 175)
    doc.text(c.sub, cx + 2.5, curY + 12)
  })

  curY += cardH + 4

  // Analytics Cards (Side-by-Side when both exist, full width if only one exists)
  const hasCategories = categoryBreakdown.length > 0 && stats.totalAmount > 0
  const hasDailyTrend = dailyTrend.length > 0 && stats.totalAmount > 0

  if (hasCategories && hasDailyTrend) {
    const chartCardGap = 4
    const chartCardW = (contentWidth - chartCardGap) / 2 // 89mm each
    const chartCardH = 34

    // Left Card: Category Breakdown
    const leftX = marginX
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.roundedRect(leftX, curY, chartCardW, chartCardH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(17, 24, 39)
    doc.text('CATEGORY SPENDING BREAKDOWN', leftX + 3.5, curY + 4.5)

    // Stacked Bar inside Left Card
    const catBarX = leftX + 3.5
    const catBarY = curY + 6.8
    const catBarW = chartCardW - 7
    const catBarH = 3.5
    let runningX = catBarX

    categoryBreakdown.forEach((cat) => {
      const segW = (cat.amount / stats.totalAmount) * catBarW
      if (segW > 0.4) {
        const rgb = hexToRgb(cat.color)
        doc.setFillColor(rgb[0], rgb[1], rgb[2])
        doc.rect(runningX, catBarY, segW, catBarH, 'F')
        runningX += segW
      }
    })

    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.15)
    doc.roundedRect(catBarX, catBarY, catBarW, catBarH, 0.5, 0.5, 'S')

    // Legend in 2 Columns below bar
    const legStartY = catBarY + catBarH + 2.6
    const col1X = leftX + 3.5
    const col2X = leftX + chartCardW / 2 + 1
    const maxLegendItems = 6
    const displayCats = categoryBreakdown.slice(0, maxLegendItems)

    displayCats.forEach((cat, idx) => {
      const isCol2 = idx % 2 === 1
      const row = Math.floor(idx / 2)
      const itemX = isCol2 ? col2X : col1X
      const itemY = legStartY + row * 5.2

      const rgb = hexToRgb(cat.color)
      doc.setFillColor(rgb[0], rgb[1], rgb[2])
      doc.circle(itemX + 1.2, itemY + 1.2, 1.1, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.2)
      doc.setTextColor(24, 24, 27)
      const catName = cat.category.length > 22 ? cat.category.slice(0, 21) + '..' : cat.category
      doc.text(catName, itemX + 3.8, itemY + 2)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.8)
      doc.setTextColor(113, 113, 122)
      doc.text(`${formatInr(cat.amount)} (${cat.percentage}%)`, itemX + 3.8, itemY + 4.4)
    })

    // Right Card: Daily Spending Trend
    const rightX = leftX + chartCardW + chartCardGap
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.roundedRect(rightX, curY, chartCardW, chartCardH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(17, 24, 39)
    doc.text('DAILY SPENDING TREND', rightX + 3.5, curY + 4.5)

    const baselineY = curY + chartCardH - 6.5
    const maxBarH = 13.5

    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.2)
    doc.line(rightX + 3.5, baselineY, rightX + chartCardW - 3.5, baselineY)

    const maxDaySpend = Math.max(...dailyTrend.map((d) => d.amount), 1)
    const trendCount = dailyTrend.length
    const trendAvailW = chartCardW - 7
    const trendStepW = trendAvailW / trendCount
    const trendBarW = Math.min(5.5, Math.max(3, trendStepW * 0.52))

    dailyTrend.forEach((d, idx) => {
      const bx = rightX + 3.5 + idx * trendStepW + (trendStepW - trendBarW) / 2
      const bh = Math.max(0.8, (d.amount / maxDaySpend) * maxBarH)
      const by = baselineY - bh

      // Bar fill (Dark zinc theme)
      doc.setFillColor(24, 24, 27)
      doc.roundedRect(bx, by, trendBarW, bh, 0.4, 0.4, 'F')

      // Date label below baseline
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.2)
      doc.setTextColor(113, 113, 122)
      doc.text(d.displayDate, bx + trendBarW / 2, baselineY + 3.8, { align: 'center' })

      // Value label above bar
      if (d.amount > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5)
        doc.setTextColor(39, 39, 42)
        const amtStr = d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : `${Math.round(d.amount)}`
        doc.text(amtStr, bx + trendBarW / 2, by - 1, { align: 'center' })
      }
    })

    curY += chartCardH + 4
  } else if (hasCategories) {
    // Full width category breakdown
    const fullCardH = 26
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.roundedRect(marginX, curY, contentWidth, fullCardH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(17, 24, 39)
    doc.text('CATEGORY SPENDING BREAKDOWN', marginX + 3.5, curY + 4.5)

    const catBarX = marginX + 3.5
    const catBarY = curY + 6.8
    const catBarW = contentWidth - 7
    const catBarH = 3.5
    let runningX = catBarX

    categoryBreakdown.forEach((cat) => {
      const segW = (cat.amount / stats.totalAmount) * catBarW
      if (segW > 0.4) {
        const rgb = hexToRgb(cat.color)
        doc.setFillColor(rgb[0], rgb[1], rgb[2])
        doc.rect(runningX, catBarY, segW, catBarH, 'F')
        runningX += segW
      }
    })

    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.15)
    doc.roundedRect(catBarX, catBarY, catBarW, catBarH, 0.5, 0.5, 'S')

    const legStartY = catBarY + catBarH + 2.6
    const legCols = 4
    const legColW = (contentWidth - 7) / legCols
    const displayCats = categoryBreakdown.slice(0, 8)

    displayCats.forEach((cat, idx) => {
      const colIdx = idx % legCols
      const rowIdx = Math.floor(idx / legCols)
      const legX = marginX + 3.5 + colIdx * legColW
      const legY = legStartY + rowIdx * 4.8

      const rgb = hexToRgb(cat.color)
      doc.setFillColor(rgb[0], rgb[1], rgb[2])
      doc.circle(legX + 1.2, legY + 1.2, 1.1, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.2)
      doc.setTextColor(24, 24, 27)
      const catName = cat.category.length > 18 ? cat.category.slice(0, 17) + '..' : cat.category
      doc.text(catName, legX + 3.8, legY + 2)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.8)
      doc.setTextColor(113, 113, 122)
      doc.text(`${formatInr(cat.amount)} (${cat.percentage}%)`, legX + 3.8, legY + 4.2)
    })

    curY += fullCardH + 4
  } else if (hasDailyTrend) {
    // Full width daily trend
    const fullCardH = 26
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.roundedRect(marginX, curY, contentWidth, fullCardH, 1.5, 1.5, 'FD')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(17, 24, 39)
    doc.text('DAILY SPENDING TREND', marginX + 3.5, curY + 4.5)

    const baselineY = curY + fullCardH - 6.5
    const maxBarH = 13.5

    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.2)
    doc.line(marginX + 3.5, baselineY, marginX + contentWidth - 3.5, baselineY)

    const maxDaySpend = Math.max(...dailyTrend.map((d) => d.amount), 1)
    const trendCount = dailyTrend.length
    const trendAvailW = contentWidth - 7
    const trendStepW = trendAvailW / trendCount
    const trendBarW = Math.min(6, Math.max(3, trendStepW * 0.52))

    dailyTrend.forEach((d, idx) => {
      const bx = marginX + 3.5 + idx * trendStepW + (trendStepW - trendBarW) / 2
      const bh = Math.max(0.8, (d.amount / maxDaySpend) * maxBarH)
      const by = baselineY - bh

      doc.setFillColor(24, 24, 27)
      doc.roundedRect(bx, by, trendBarW, bh, 0.4, 0.4, 'F')

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.2)
      doc.setTextColor(113, 113, 122)
      doc.text(d.displayDate, bx + trendBarW / 2, baselineY + 3.8, { align: 'center' })

      if (d.amount > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5)
        doc.setTextColor(39, 39, 42)
        const amtStr = d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : `${Math.round(d.amount)}`
        doc.text(amtStr, bx + trendBarW / 2, by - 1, { align: 'center' })
      }
    })

    curY += fullCardH + 4
  }

  // Expense Table
  const tableHead = [['#', 'Date', 'Title & Notes', 'Workspace', 'Category', 'Payment', 'Amount']]

  const tableBody = expenses.map((e, idx) => {
    let titleNotes = sanitizeText(e.title)
    if (e.notes && e.notes.trim()) {
      titleNotes += `\n(${sanitizeText(e.notes.trim())})`
    }
    return [
      String(idx + 1),
      e.date || '—',
      titleNotes,
      e.projectName || 'General',
      e.category || 'Miscellaneous',
      formatPaymentMethod(e.paymentMethod),
      formatInr(Number(e.amount)),
    ]
  })

  const tableFoot = [
    [
      {
        content: `TOTAL FILTERED EXPENDITURE (${expenses.length} records)`,
        colSpan: 6,
        styles: { halign: 'left' as const, fontStyle: 'bold' as const },
      },
      {
        content: formatInr(stats.totalAmount),
        styles: { halign: 'right' as const, fontStyle: 'bold' as const },
      },
    ],
  ]

  const runner =
    typeof autoTable === 'function'
      ? autoTable
      : (autoTable as unknown as { default: typeof autoTable }).default || autoTable

  runner(doc, {
    startY: curY,
    head: tableHead,
    body: tableBody,
    foot: tableFoot,
    theme: 'grid',
    rowPageBreak: 'avoid',
    showHead: 'everyPage',
    styles: {
      font: 'helvetica',
      fontSize: 6.8,
      textColor: [39, 39, 42],
      lineColor: [229, 231, 235],
      lineWidth: 0.15,
      cellPadding: 1.6,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    footStyles: {
      fillColor: [244, 244, 245],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      fontSize: 7.2,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 60, halign: 'left' },
      3: { cellWidth: 24, halign: 'left' },
      4: { cellWidth: 26, halign: 'left' },
      5: { cellWidth: 22, halign: 'center' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: marginX, right: marginX, bottom: 12 },
    showFoot: 'lastPage',
  })

  // Footers on every page
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.8)
    doc.setTextColor(156, 163, 175)

    // Left Footer
    doc.text('TicketFlow Expense Management • Confidential Financial Report', marginX, pageHeight - 6)

    // Right Footer
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 6, { align: 'right' })

    // Footer divider line
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.15)
    doc.line(marginX, pageHeight - 9, pageWidth - marginX, pageHeight - 9)
  }

  const cleanMonth = activeMonth !== 'ALL' ? activeMonth : 'all-time'
  const cleanWorkspace = selectedProject !== 'ALL' ? `-${selectedProject.toLowerCase().replace(/\s+/g, '-')}` : ''
  const fileName = `ticketflow-expenses-${cleanMonth}${cleanWorkspace}.pdf`

  doc.save(fileName)
}
