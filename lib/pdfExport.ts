/**
 * PDF Export Utility
 * Generates beautiful monthly financial reports as PDF
 */

import type { FinanceTransaction } from '@/types/finance'
import { format } from 'date-fns'

export interface MonthlyReportData {
  period: { start: Date; end: Date; label: string }
  summary: {
    totalIncome: number
    totalExpenses: number
    balance: number
    transactionCount: number
    savingsRate: number
  }
  topCategories: Array<{ category: string; amount: number; percentage: number; count: number }>
  monthlyBreakdown: Array<{ month: string; income: number; expenses: number; savings: number }>
  transactions: FinanceTransaction[]
}

/**
 * Generate PDF using browser print API (no external dependencies)
 */
export function generatePDFReport(data: MonthlyReportData): void {
  // Create a printable HTML document
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF')
    return
  }

  const { period, summary, topCategories, monthlyBreakdown } = data

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Monthly Financial Report - ${period.label}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      line-height: 1.6;
      padding: 40px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #6366f1;
    }
    .header h1 {
      font-size: 32px;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .header .period {
      font-size: 18px;
      color: #6b7280;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .summary-card.income {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    }
    .summary-card.expense {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    }
    .summary-card.balance {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    }
    .summary-card h3 {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 24px;
      color: #1f2937;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    .category-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    .category-item {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #6366f1;
    }
    .category-item h4 {
      font-size: 16px;
      color: #1f2937;
      margin-bottom: 8px;
    }
    .category-item .amount {
      font-size: 20px;
      font-weight: bold;
      color: #6366f1;
      margin-bottom: 4px;
    }
    .category-item .meta {
      font-size: 12px;
      color: #6b7280;
    }
    .monthly-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    .monthly-table th,
    .monthly-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    .monthly-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }
    .monthly-table tr:hover {
      background: #f9fafb;
    }
    .positive {
      color: #10b981;
      font-weight: 600;
    }
    .negative {
      color: #ef4444;
      font-weight: 600;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .summary-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .category-list {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 Monthly Financial Report</h1>
    <div class="period">${period.label}</div>
    <div style="margin-top: 10px; font-size: 14px; color: #6b7280;">
      Generated on ${format(new Date(), 'MMMM d, yyyy')}
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card income">
      <h3>Total Income</h3>
      <div class="value">${formatCurrency(summary.totalIncome)}</div>
    </div>
    <div class="summary-card expense">
      <h3>Total Expenses</h3>
      <div class="value">${formatCurrency(summary.totalExpenses)}</div>
    </div>
    <div class="summary-card balance">
      <h3>Net Balance</h3>
      <div class="value">${formatCurrency(summary.balance)}</div>
    </div>
    <div class="summary-card">
      <h3>Savings Rate</h3>
      <div class="value">${summary.savingsRate.toFixed(1)}%</div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.9;">
        ${summary.transactionCount} transactions
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Top Spending Categories</h2>
    <div class="category-list">
      ${topCategories.map(cat => `
        <div class="category-item">
          <h4>${cat.category}</h4>
          <div class="amount">${formatCurrency(cat.amount)}</div>
          <div class="meta">${cat.percentage.toFixed(1)}% • ${cat.count} transaction${cat.count !== 1 ? 's' : ''}</div>
        </div>
      `).join('')}
    </div>
  </div>

  ${monthlyBreakdown.length > 0 ? `
  <div class="section">
    <h2>Monthly Breakdown</h2>
    <table class="monthly-table">
      <thead>
        <tr>
          <th>Month</th>
          <th>Income</th>
          <th>Expenses</th>
          <th>Savings</th>
        </tr>
      </thead>
      <tbody>
        ${monthlyBreakdown.map(month => `
          <tr>
            <td>${month.month}</td>
            <td class="positive">${formatCurrency(month.income)}</td>
            <td class="negative">${formatCurrency(month.expenses)}</td>
            <td class="${month.savings >= 0 ? 'positive' : 'negative'}">${formatCurrency(month.savings)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  ` : ''}

  <div class="footer">
    <p>Generated by UPSHIFT Finance Tracker</p>
    <p>Report period: ${format(period.start, 'MMM d, yyyy')} - ${format(period.end, 'MMM d, yyyy')}</p>
  </div>

  <script>
    window.onload = function() {
      window.print();
      setTimeout(() => window.close(), 1000);
    };
  </script>
</body>
</html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Prepare monthly report data from transactions
 */
export function prepareMonthlyReportData(
  transactions: FinanceTransaction[],
  periodStart: Date,
  periodEnd: Date
): MonthlyReportData {
  // Calculate summary
  let totalIncome = 0
  let totalExpenses = 0
  const categoryTotals: Record<string, { amount: number; count: number }> = {}

  transactions.forEach((tx) => {
    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
    const isExpense = type === 'expense' || amount < 0

    if (isIncome) {
      totalIncome += Math.abs(amount)
    } else if (isExpense) {
      const absAmount = Math.abs(amount)
      totalExpenses += absAmount

      const category = tx.category || 'Other'
      if (!categoryTotals[category]) {
        categoryTotals[category] = { amount: 0, count: 0 }
      }
      categoryTotals[category].amount += absAmount
      categoryTotals[category].count += 1
    }
  })

  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0

  // Top categories
  const topCategories = Object.entries(categoryTotals)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10)

  // Monthly breakdown (if period spans multiple months)
  const monthlyBreakdown: Array<{ month: string; income: number; expenses: number; savings: number }> = []
  const monthlyData = new Map<string, { income: number; expenses: number }>()

  transactions.forEach((tx) => {
    const txDate = typeof tx.date === 'string' ? new Date(tx.date) : (tx.date as Date)
    const monthKey = format(txDate, 'yyyy-MM')
    
    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, { income: 0, expenses: 0 })
    }

    const amount = Number(tx.amount) || 0
    const type = (tx.type || '').toLowerCase()
    const isIncome = type === 'income' || (type !== 'expense' && amount > 0)
    const isExpense = type === 'expense' || amount < 0

    const data = monthlyData.get(monthKey)!
    if (isIncome) {
      data.income += Math.abs(amount)
    } else if (isExpense) {
      data.expenses += Math.abs(amount)
    }
  })

  Array.from(monthlyData.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([monthKey, data]) => {
      monthlyBreakdown.push({
        month: format(new Date(monthKey + '-01'), 'MMMM yyyy'),
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      })
    })

  return {
    period: {
      start: periodStart,
      end: periodEnd,
      label: format(periodStart, 'MMMM yyyy'),
    },
    summary: {
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: transactions.length,
      savingsRate,
    },
    topCategories,
    monthlyBreakdown,
    transactions,
  }
}

