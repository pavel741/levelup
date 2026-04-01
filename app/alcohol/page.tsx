'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format, startOfWeek, subDays } from 'date-fns'
import AuthGuard from '@/components/common/AuthGuard'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useFirestoreStore } from '@/store/useFirestoreStore'
import { Wine, Plus, Trash2, Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/common/LanguageProvider'
import { isAlcoholCutbackAdmin } from '@/lib/alcoholAdmin'
import { fetchAlcoholLogs, createAlcoholLog, deleteAlcoholLog } from '@/lib/alcoholLogsApi'
import type { AlcoholLog } from '@/types/alcoholLog'
import { showError } from '@/lib/utils'

export default function AlcoholPage() {
  const { user } = useFirestoreStore()
  const { t } = useLanguage()
  const router = useRouter()
  const allowed = isAlcoholCutbackAdmin(user?.id)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [logs, setLogs] = useState<AlcoholLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [formDate, setFormDate] = useState(() => format(new Date(), 'yyyy-MM-dd'))
  const [formDrinks, setFormDrinks] = useState('0')
  const [formNotes, setFormNotes] = useState('')

  useEffect(() => {
    if (!user) return
    if (!allowed) {
      router.replace('/')
    }
  }, [user, allowed, router])

  useEffect(() => {
    if (!user || !allowed) return
    let cancelled = false
    setLoading(true)
    fetchAlcoholLogs()
      .then((data) => {
        if (!cancelled) setLogs(data)
      })
      .catch((err: Error) => {
        if (!cancelled) showError(err.message || t('alcohol.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user, allowed, t])

  const today = format(new Date(), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const sevenAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd')

  const stats = useMemo(() => {
    const sumRange = (from: string, to: string) =>
      logs.filter((l) => l.date >= from && l.date <= to).reduce((s, l) => s + l.drinks, 0)
    return {
      thisWeek: sumRange(weekStart, today),
      last7: sumRange(sevenAgo, today),
    }
  }, [logs, weekStart, today, sevenAgo])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !allowed) return
    const drinks = parseFloat(formDrinks.replace(',', '.'))
    if (Number.isNaN(drinks) || drinks < 0 || drinks > 99) {
      showError(t('alcohol.invalidDrinks'))
      return
    }
    setSaving(true)
    try {
      await createAlcoholLog({
        date: formDate,
        drinks,
        notes: formNotes.trim() || undefined,
      })
      const next = await fetchAlcoholLogs()
      setLogs(next)
      setFormNotes('')
      setFormDrinks('0')
      setFormDate(format(new Date(), 'yyyy-MM-dd'))
    } catch (err) {
      showError(err instanceof Error ? err.message : t('alcohol.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('alcohol.deleteConfirm'))) return
    setDeletingId(id)
    try {
      await deleteAlcoholLog(id)
      setLogs((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      showError(err instanceof Error ? err.message : t('alcohol.deleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <AuthGuard>
      {!user || !allowed ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-hidden />
        </div>
      ) : (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex h-screen overflow-hidden">
          <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Header onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} isMenuOpen={isMobileMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Wine className="w-8 h-8 text-violet-600 dark:text-violet-400" aria-hidden />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('alcohol.title')}</h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{t('alcohol.subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-4 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('alcohol.thisWeek')}</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                      {stats.thisWeek.toFixed(1)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-4 shadow-sm">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('alcohol.last7Days')}</p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                      {stats.last7.toFixed(1)}
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleAdd}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-4 sm:p-6 shadow-sm space-y-4"
                >
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Plus className="w-5 h-5 text-violet-600" />
                    {t('alcohol.addEntry')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="block">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('alcohol.date')}</span>
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
                        required
                      />
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{t('alcohol.drinks')}</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formDrinks}
                        onChange={(e) => setFormDrinks(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white tabular-nums"
                        placeholder="0"
                        required
                      />
                    </label>
                    <label className="block sm:col-span-1">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {t('alcohol.notes')} ({t('common.optional')})
                      </span>
                      <input
                        type="text"
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        maxLength={500}
                        className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-white font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {t('common.save')}
                  </button>
                </form>

                <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('alcohol.recentEntries')}</h2>
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                    </div>
                  ) : logs.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">{t('alcohol.noEntries')}</p>
                  ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {logs.map((log) => (
                        <li key={log.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white tabular-nums">
                              {log.date} — {log.drinks} {t('alcohol.drinksUnit')}
                            </p>
                            {log.notes ? (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{log.notes}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDelete(log.id)}
                            disabled={deletingId === log.id}
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                            aria-label={t('common.delete')}
                          >
                            {deletingId === log.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </main>
          </div>
        </div>
      </div>
      )}
    </AuthGuard>
  )
}
