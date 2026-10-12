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

function formatMonthLabel(mKey: string): string {
  if (mKey === 'ALL') return 'All Time'
  const parts = mKey.split('-')
  if (parts.length < 2) return mKey
  const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
  return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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
  doc.setLineWidth(0.4)
  const tx = marginX + 2.1
  const ty = curY + 2.6
  const tw = 6.8
  const th = 5.6
  doc.roundedRect(tx, ty, tw, th, 1, 1, 'S')

  // Dashed divider line inside Ticket
  doc.setLineDashPattern([0.6, 0.6], 0)
  doc.line(tx + 2.3, ty, tx + 2.3, ty + th)
  doc.setLineDashPattern([], 0)

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

  const filterBoxH = 8
  doc.setFillColor(244, 244, 245)
  doc.setDrawColor(228, 228, 231)
  doc.setLineWidth(0.2)
  doc.roundedRect(marginX, curY, contentWidth, filterBoxH, 1.5, 1.5, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6.5)
  doc.setTextColor(113, 113, 122)
  doc.text('APPLIED FILTERS:', marginX + 3, curY + 5.2)

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
    filterParts.push(`Search: "${searchQuery.trim()}"`)
  }

  const filterText = filterParts.join('   |   ')
  doc.text(filterText, marginX + 30, curY + 5.2)

  curY += filterBoxH + 4

  // =========================================================================
  // 3. KPI METRIC SUMMARY CARDS (4 Columns)
  // =========================================================================
  const cardGap = 3
  const cardW = (contentWidth - cardGap * 3) / 4
  const cardH = 15

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
    doc.text(c.title, cx + 2.5, curY + 4)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(17, 24, 39)
    doc.text(c.value, cx + 2.5, curY + 9)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6)
    doc.setTextColor(156, 163, 175)
    doc.text(c.sub, cx + 2.5, curY + 13)
  })

  curY += cardH + 5

  if (categoryBreakdown.length > 0 && stats.totalAmount > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(17, 24, 39)
    doc.text('CATEGORY SPENDING BREAKDOWN', marginX, curY + 2)

    curY += 4

    // Stacked Percentage Distribution Bar
    const barH = 4.5
    let barX = marginX

    categoryBreakdown.forEach((cat) => {
      const segWidth = (cat.amount / stats.totalAmount) * contentWidth
      if (segWidth > 0.5) {
        const rgb = hexToRgb(cat.color)
        doc.setFillColor(rgb[0], rgb[1], rgb[2])
        doc.rect(barX, curY, segWidth, barH, 'F')
        barX += segWidth
      }
    })

    // Outer subtle border around distribution bar
    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.2)
    doc.roundedRect(marginX, curY, contentWidth, barH, 0.8, 0.8, 'S')

    curY += barH + 3

    // Category Legend Grid (up to 8 items in 2 rows)
    const displayCats = categoryBreakdown.slice(0, 8)
    const legCols = 4
    const legColW = contentWidth / legCols

    displayCats.forEach((cat, idx) => {
      const colIdx = idx % legCols
      const rowIdx = Math.floor(idx / legCols)
      const legX = marginX + colIdx * legColW
      const legY = curY + rowIdx * 5

      const rgb = hexToRgb(cat.color)
      doc.setFillColor(rgb[0], rgb[1], rgb[2])
      doc.circle(legX + 1.5, legY + 1.2, 1.2, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      doc.setTextColor(31, 41, 55)
      const name = cat.category.length > 13 ? cat.category.slice(0, 12) + '..' : cat.category
      doc.text(`${name}:`, legX + 4.5, legY + 2)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6.5)
      doc.setTextColor(75, 85, 99)
      doc.text(`${formatInr(cat.amount)} (${cat.percentage}%)`, legX + 4.5, legY + 4.2)
    })

    const totalRows = Math.ceil(displayCats.length / legCols)
    curY += totalRows * 5 + 3
  }

  if (dailyTrend.length > 0 && stats.totalAmount > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(17, 24, 39)
    doc.text('DAILY SPENDING TREND', marginX, curY + 2)

    curY += 4

    const chartBoxH = 22
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.2)
    doc.roundedRect(marginX, curY, contentWidth, chartBoxH, 1.5, 1.5, 'FD')

    const baselineY = curY + chartBoxH - 5.5
    const maxBarH = 12

    // Baseline axis
    doc.setDrawColor(228, 228, 231)
    doc.setLineWidth(0.2)
    doc.line(marginX + 4, baselineY, marginX + contentWidth - 4, baselineY)

    const maxDaySpend = Math.max(...dailyTrend.map((d) => d.amount), 1)
    const barCount = dailyTrend.length
    const availableW = contentWidth - 10
    const stepW = availableW / barCount
    const actualBarW = Math.min(8, Math.max(3.5, stepW * 0.55))

    dailyTrend.forEach((d, idx) => {
      const bx = marginX + 5 + idx * stepW + (stepW - actualBarW) / 2
      const bh = Math.max(0.8, (d.amount / maxDaySpend) * maxBarH)
      const by = baselineY - bh

      // Bar fill (Dark zinc theme)
      doc.setFillColor(24, 24, 27)
      doc.roundedRect(bx, by, actualBarW, bh, 0.4, 0.4, 'F')

      // Date label below baseline
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.setTextColor(113, 113, 122)
      doc.text(d.displayDate, bx + actualBarW / 2, baselineY + 3.5, { align: 'center' })

      // Value label above bar
      if (d.amount > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5)
        doc.setTextColor(82, 82, 91)
        const amtStr = d.amount >= 1000 ? `${(d.amount / 1000).toFixed(1)}k` : `${Math.round(d.amount)}`
        doc.text(amtStr, bx + actualBarW / 2, by - 1, { align: 'center' })
      }
    })

    curY += chartBoxH + 4
  }

  const tableHead = [['#', 'Date', 'Title & Notes', 'Workspace', 'Category', 'Payment', 'Amount']]

  const tableBody = expenses.map((e, idx) => {
    let titleNotes = e.title
    if (e.notes && e.notes.trim()) {
      titleNotes += `\n(${e.notes.trim()})`
    }
    return [
      String(idx + 1),
      e.date || '—',
      titleNotes,
      e.projectName || 'General',
      e.category || 'Miscellaneous',
      e.paymentMethod || 'OTHER',
      formatInr(Number(e.amount)),
    ]
  })

  const tableFoot = [
    [
      '',
      '',
      `TOTAL FILTERED EXPENDITURE (${expenses.length} records)`,
      '',
      '',
      '',
      formatInr(stats.totalAmount),
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
    styles: {
      font: 'helvetica',
      fontSize: 7,
      textColor: [39, 39, 42],
      lineColor: [229, 231, 235],
      lineWidth: 0.15,
      cellPadding: 1.8,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [24, 24, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
      cellPadding: 2.2,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    footStyles: {
      fillColor: [244, 244, 245],
      textColor: [17, 24, 39],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20, halign: 'left' },
      2: { cellWidth: 54, halign: 'left' },
      3: { cellWidth: 26, halign: 'left' },
      4: { cellWidth: 30, halign: 'left' },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: marginX, right: marginX, bottom: 14 },
    showFoot: 'lastPage',
  })

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(156, 163, 175)

    // Left Footer
    doc.text('TicketFlow Expense Management • Confidential Financial Report', marginX, pageHeight - 7)

    // Right Footer
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 7, { align: 'right' })

    // Footer divider line
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(0.15)
    doc.line(marginX, pageHeight - 10, pageWidth - marginX, pageHeight - 10)
  }

  const cleanMonth = activeMonth !== 'ALL' ? activeMonth : 'all-time'
  const cleanWorkspace = selectedProject !== 'ALL' ? `-${selectedProject.toLowerCase().replace(/\s+/g, '-')}` : ''
  const fileName = `ticketflow-expenses-${cleanMonth}${cleanWorkspace}.pdf`

  doc.save(fileName)
}
