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
  Search,
  Filter,
  Eye,
  ChevronDown,
  Bug,
  Zap,
  Database,
  Webhook,
  CreditCard,
  Bot,
  Server
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { ErrorLog } from '@/types'

interface ErrorStats {
  total: number
  new: number
  investigating: number
  resolved: number
  critical: number
  error: number
  warning: number
  byType: Record<string, number>
}

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
      return <Info className="w-4 h-4 text-white/40" />
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
    case 'system':
      return <Server className="w-3 h-3" />
    case 'user_feature':
      return <Bug className="w-3 h-3" />
    case 'bot':
      return <Bot className="w-3 h-3" />
    case 'payment':
      return <CreditCard className="w-3 h-3" />
    case 'api':
      return <Zap className="w-3 h-3" />
    case 'database':
      return <Database className="w-3 h-3" />
    case 'webhook':
      return <Webhook className="w-3 h-3" />
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

export default function AdminErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [updating, setUpdating] = useState(false)
  const [resolveNote, setResolveNote] = useState('')

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('limit', '200')
      if (statusFilter) params.set('status', statusFilter)
      if (severityFilter) params.set('severity', severityFilter)
      if (typeFilter) params.set('type', typeFilter)

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/error-logs?${params.toString()}`),
        fetch('/api/admin/error-logs?stats=true')
      ])

      if (logsRes.ok) {
        const data = await logsRes.json()
        setLogs(data.logs || [])
      }
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch error logs:', error)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, severityFilter, typeFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 10000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, fetchLogs])

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true)
    try {
      const res = await fetch('/api/admin/error-logs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status,
          resolvedNote: status === 'resolved' ? resolveNote : undefined
        }),
      })

      if (res.ok) {
        await fetchLogs()
        setDetailOpen(false)
        setResolveNote('')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      log.message.toLowerCase().includes(query) ||
      log.source.toLowerCase().includes(query) ||
      (log.userName?.toLowerCase().includes(query)) ||
      (log.userEmail?.toLowerCase().includes(query))
    )
  })

  const statsCards = [
    { label: 'Total', value: stats?.total || 0, color: 'text-foreground', bg: 'bg-muted' },
    { label: 'New', value: stats?.new || 0, color: 'text-red-600', bg: 'bg-red-500/20' },
    { label: 'Investigating', value: stats?.investigating || 0, color: 'text-amber-600', bg: 'bg-amber-500/20' },
    { label: 'Resolved', value: stats?.resolved || 0, color: 'text-emerald-600', bg: 'bg-emerald-500/20' },
    { label: 'Critical', value: stats?.critical || 0, color: 'text-red-600', bg: 'bg-red-600/20' },
    { label: 'Error', value: stats?.error || 0, color: 'text-orange-600', bg: 'bg-orange-500/20' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">Error Logs Console</h1>
          <p className="text-muted-foreground mt-1">Monitor dan kelola error logs system</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'text-emerald-500' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Live' : 'Auto Refresh'}
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsCards.map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-border`}>
            <p className="text-muted-foreground text-xs uppercase tracking-wide">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Status
              {statusFilter && <span className="ml-1 text-primary">({statusFilter})</span>}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('')}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter('new')}>New</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('investigating')}>Investigating</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('resolved')}>Resolved</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('ignored')}>Ignored</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Severity
              {severityFilter && <span className="ml-1 text-primary">({severityFilter})</span>}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSeverityFilter('')}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSeverityFilter('critical')}>Critical</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSeverityFilter('error')}>Error</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSeverityFilter('warning')}>Warning</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSeverityFilter('info')}>Info</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Bug className="w-4 h-4 mr-2" />
              Type
              {typeFilter && <span className="ml-1 text-primary">({typeFilter})</span>}
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setTypeFilter('')}>All</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTypeFilter('system')}>System</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('user_feature')}>User Feature</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('bot')}>Bot</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('payment')}>Payment</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('api')}>API</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('database')}>Database</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTypeFilter('webhook')}>Webhook</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Terminal Console */}
      <NeoCard className="bg-card border-border">
        <NeoCardHeader className="flex flex-row items-center justify-between">
          <NeoCardTitle className="text-foreground flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-red-400" />
            </div>
            Error Console
            <NeoBadge variant="secondary" className="ml-2">
              {filteredLogs.length} logs
            </NeoBadge>
          </NeoCardTitle>
        </NeoCardHeader>
        <NeoCardContent>
          <div className="bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-xs">
            {/* Terminal Header */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-900">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-zinc-500">error-console@admin ~ </span>
            </div>
            
            <ScrollArea className="h-[500px] p-3">
              {loading ? (
                <div className="text-zinc-500 text-center py-8">
                  Loading error logs...
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-zinc-500 text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-500/50" />
                  <p>No error logs found.</p>
                  <p className="text-xs mt-1">System is running smoothly!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredLogs.map((log) => (
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
                      {log.userName && (
                        <span className="text-yellow-400 shrink-0">@{log.userName}</span>
                      )}
                      {log.isSensitive && (
                        <span className="text-rose-400 shrink-0 text-[10px]">[SENSITIVE]</span>
                      )}
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] ${getStatusColor(log.status)}`}>
                        {log.status}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedLog && getSeverityIcon(selectedLog.severity)}
              Error Detail
            </DialogTitle>
            <DialogDescription>
              {selectedLog && formatTime(selectedLog.createdAt)}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Status & Actions */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Status:</span>
                  <NeoBadge className={getStatusColor(selectedLog.status)}>
                    {selectedLog.status}
                  </NeoBadge>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLog.status !== 'resolved' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(selectedLog.id, 'investigating')}
                        disabled={updating || selectedLog.status === 'investigating'}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Investigate
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => updateStatus(selectedLog.id, 'resolved')}
                        disabled={updating}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Resolve
                      </Button>
                    </>
                  )}
                  {selectedLog.status !== 'ignored' && selectedLog.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateStatus(selectedLog.id, 'ignored')}
                      disabled={updating}
                    >
                      Ignore
                    </Button>
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Type</p>
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
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Source</p>
                  <p className="text-foreground font-mono text-xs">{selectedLog.source}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">Sensitive</p>
                  <p className={selectedLog.isSensitive ? 'text-red-400' : 'text-emerald-400'}>
                    {selectedLog.isSensitive ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {/* User Info */}
              {selectedLog.userName && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-1">User</p>
                  <p className="text-foreground">{selectedLog.userName} ({selectedLog.userEmail})</p>
                </div>
              )}

              {/* Message */}
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-muted-foreground text-xs mb-1">Message</p>
                <p className="text-foreground whitespace-pre-wrap">{selectedLog.message}</p>
              </div>

              {/* Stack Trace */}
              {selectedLog.stackTrace && (
                <div className="p-3 bg-[#0a0a0a] rounded-lg border border-white/10">
                  <p className="text-muted-foreground text-xs mb-2">Stack Trace</p>
                  <pre className="text-red-400 text-xs whitespace-pre-wrap font-mono overflow-x-auto">
                    {selectedLog.stackTrace}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-2">Metadata</p>
                  <pre className="text-foreground text-xs whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Resolved Info */}
              {selectedLog.status === 'resolved' && (
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <p className="text-emerald-400 text-xs mb-1">Resolved</p>
                  <p className="text-foreground text-sm">
                    By {selectedLog.resolvedBy} on {selectedLog.resolvedAt && formatTime(selectedLog.resolvedAt)}
                  </p>
                  {selectedLog.resolvedNote && (
                    <p className="text-muted-foreground text-sm mt-2">{selectedLog.resolvedNote}</p>
                  )}
                </div>
              )}

              {/* Resolve Note Input */}
              {selectedLog.status !== 'resolved' && (
                <div>
                  <p className="text-muted-foreground text-xs mb-2">Resolution Note (optional)</p>
                  <Textarea
                    placeholder="Add notes about how this was resolved..."
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    className="bg-background"
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
