'use client'

import { useEffect, useState, useCallback } from 'react'
import { NeoCard, NeoCardHeader, NeoCardTitle, NeoCardContent } from '@/components/ui/neo-card'
import { NeoBadge } from '@/components/ui/neo-badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Terminal, 
  RefreshCw, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  XCircle,
  CheckCircle,
  Clock,
  Eye,
  Bug,
  Zap,
  CreditCard,
  Bot,
  HelpCircle
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ErrorLog } from '@/types'

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return <XCircle className="w-4 h-4 text-red-500" />
    case 'error':
      return <AlertCircle className="w-4 h-4 text-orange-500" />
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-500" />
    case 'info':
      return <Info className="w-4 h-4 text-blue-500" />
    default:
      return <Info className="w-4 h-4 text-muted-foreground" />
  }
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-950 text-red-400 border-red-800'
    case 'error':
      return 'bg-orange-950 text-orange-400 border-orange-800'
    case 'warning':
      return 'bg-amber-950 text-amber-400 border-amber-800'
    case 'info':
      return 'bg-blue-950 text-blue-400 border-blue-800'
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'new':
      return 'bg-red-950 text-red-400'
    case 'investigating':
      return 'bg-amber-950 text-amber-400'
    case 'resolved':
      return 'bg-emerald-950 text-emerald-400'
    case 'ignored':
      return 'bg-zinc-800 text-zinc-500'
    default:
      return 'bg-zinc-800 text-zinc-400'
  }
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'user_feature':
      return <Bug className="w-3 h-3" />
    case 'bot':
      return <Bot className="w-3 h-3" />
    case 'payment':
      return <CreditCard className="w-3 h-3" />
    case 'api':
      return <Zap className="w-3 h-3" />
    default:
      return <Bug className="w-3 h-3" />
  }
}

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('id-ID', { 
    day: '2-digit',
    month: 'short',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

export default function UserConsolePage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/error-logs?limit=100')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (error) {
      console.error('Failed to fetch error logs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 15000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, fetchLogs])

  const newCount = logs.filter(l => l.status === 'new').length
  const errorCount = logs.filter(l => l.severity === 'error' || l.severity === 'critical').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Console</h1>
          <p className="text-muted-foreground mt-1">Lihat error dan log dari fitur kamu</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'text-emerald-500' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live' : 'Auto'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-4 border border-border">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">Total Logs</p>
          <p className="text-2xl font-bold text-foreground mt-1">{logs.length}</p>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <p className="text-red-500 text-xs uppercase tracking-wide">New Issues</p>
          <p className="text-2xl font-bold text-red-500 mt-1">{newCount}</p>
        </div>
        <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
          <p className="text-orange-500 text-xs uppercase tracking-wide">Errors</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">{errorCount}</p>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-foreground font-medium">Apa itu Console?</p>
          <p className="text-muted-foreground text-sm mt-1">
            Console menampilkan error dan log dari fitur-fitur yang kamu gunakan, seperti bot, pembayaran, dan lainnya. 
            Error sensitif hanya terlihat oleh admin. Jika ada error yang perlu ditangani, admin akan segera memperbaikinya.
          </p>
        </div>
      </div>

      {/* Terminal Console */}
      <NeoCard className="bg-card border-border">
        <NeoCardHeader className="flex flex-row items-center justify-between">
          <NeoCardTitle className="text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-violet-500" />
            </div>
            My Console
            {logs.length > 0 && (
              <NeoBadge variant="secondary" className="ml-2">
                {logs.length} logs
              </NeoBadge>
            )}
          </NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent>
          <div className="bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-xs">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-zinc-500">console@user ~ </span>
            </div>
            
            <ScrollArea className="h-[400px] p-3">
              {loading ? (
                <div className="text-zinc-500 text-center py-8">
                  Loading logs...
                </div>
              ) : logs.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                  <p>Tidak ada error!</p>
                  <p className="text-xs mt-1">Semua fitur berjalan dengan baik.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {logs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-start gap-2 text-[11px] leading-relaxed p-2 rounded hover:bg-zinc-900 cursor-pointer transition-colors group"
                      onClick={() => {
                        setSelectedLog(log)
                        setDetailOpen(true)
                      }}
                    >
                      <span className="text-zinc-600 shrink-0">[{formatTime(log.createdAt)}]</span>
                      <span className="shrink-0">{getSeverityIcon(log.severity)}</span>
                      <span className={`shrink-0 uppercase font-semibold px-1.5 py-0.5 rounded text-[10px] ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                      <span className="shrink-0 text-purple-400 flex items-center gap-1">
                        {getTypeIcon(log.type)}
                        {log.type}
                      </span>
                      <span className="text-sky-400 shrink-0">[{log.source}]</span>
                      <span className="text-zinc-200 break-all flex-1">{log.message}</span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] ${getStatusColor(log.status)}`}>
                        {log.status === 'resolved' ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Fixed
                          </span>
                        ) : log.status === 'investigating' ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> In Progress
                          </span>
                        ) : (
                          log.status
                        )}
                      </span>
                      <Eye className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </NeoCardContent>
      </NeoCard>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedLog && getSeverityIcon(selectedLog.severity)}
              Detail Error
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatTime(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-muted-foreground text-sm">Status:</span>
                <NeoBadge className={getStatusColor(selectedLog.status)}>
                  {selectedLog.status === 'resolved' ? 'Sudah Diperbaiki' : 
                   selectedLog.status === 'investigating' ? 'Sedang Ditangani' : 
                   selectedLog.status === 'ignored' ? 'Diabaikan' : 'Baru'}
                </NeoBadge>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Tipe</p>
                  <p className="text-foreground flex items-center gap-2">
                    {getTypeIcon(selectedLog.type)} {selectedLog.type}
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Severity</p>
                  <p className={`flex items-center gap-2 ${getSeverityColor(selectedLog.severity).split(' ')[1]}`}>
                    {getSeverityIcon(selectedLog.severity)} {selectedLog.severity}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Source</p>
                <p className="text-foreground font-mono text-xs">{selectedLog.source}</p>
              </div>

              {/* Message */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Pesan</p>
                <p className="text-foreground whitespace-pre-wrap">{selectedLog.message}</p>
              </div>

              {/* Resolved Info */}
              {selectedLog.status === 'resolved' && (
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-emerald-500 text-xs mb-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Sudah Diperbaiki
                  </p>
                  <p className="text-foreground text-sm">
                    Oleh {selectedLog.resolvedBy} pada {selectedLog.resolvedAt && formatTime(selectedLog.resolvedAt)}
                  </p>
                  {selectedLog.resolvedNote && (
                    <p className="text-muted-foreground text-sm mt-2 italic">{selectedLog.resolvedNote}</p>
                  )}
                </div>
              )}

              {/* Investigating Info */}
              {selectedLog.status === 'investigating' && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-amber-500 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Sedang ditangani oleh admin
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
