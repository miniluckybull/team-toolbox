import { Search, Plus, Copy, Wifi } from 'lucide-react'
import { ViewMode } from '../types'

interface Props {
  search: string
  onSearch: (v: string) => void
  onAdd: () => void
  isOnline: boolean
  readOnlyShared: boolean
  shareUrl: string | null
  activeView: ViewMode
  onViewChange: (view: ViewMode) => void
  onBecomeShared: () => void
  onCopyShareUrl: () => void
  pendingCount: number
}

const VIEWS: Array<{ id: ViewMode; label: string }> = [
  { id: 'discover', label: '发现' },
  { id: 'directory', label: '目录' },
  { id: 'spaces', label: '空间' },
  { id: 'ai', label: 'AI' },
  { id: 'inbox', label: '收件箱' },
]

export default function Header({
  search,
  onSearch,
  onAdd,
  isOnline,
  readOnlyShared,
  shareUrl,
  activeView,
  onViewChange,
  onBecomeShared,
  onCopyShareUrl,
  pendingCount,
}: Props) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0a12]/85 px-6">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-white">Team Toolbox</span>
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          {VIEWS.map(view => {
            const active = activeView === view.id
            const showBadge = view.id === 'inbox' && pendingCount > 0
            return (
              <button
                key={view.id}
                onClick={() => onViewChange(view.id)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition ${active ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                {view.label}
                {showBadge && <span className="rounded-full bg-cyan-500 px-1 text-[10px] text-white">{pendingCount}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="搜索资源、任务或团队"
            className="w-full rounded-full border border-white/6 bg-[#111118] py-2 pl-9 pr-4 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/40"
          />
        </div>

        {!isOnline && (
          <button
            onClick={onBecomeShared}
            className="rounded-full border border-cyan-500/30 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-500/10"
          >
            <Wifi className="mr-1 inline h-3.5 w-3.5" /> 开启共享
          </button>
        )}

        {isOnline && shareUrl && (
          <button
            onClick={onCopyShareUrl}
            className="rounded-full border border-cyan-500/30 px-3 py-2 text-xs text-cyan-400 hover:bg-cyan-500/10"
          >
            <Copy className="mr-1 inline h-3.5 w-3.5" /> 复制链接
          </button>
        )}

        <button
          onClick={onAdd}
          disabled={readOnlyShared}
          className="rounded-full bg-white/10 px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="mr-1 inline h-3.5 w-3.5" /> 新增
        </button>
      </div>
    </header>
  )
}
