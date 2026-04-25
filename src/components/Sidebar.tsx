import { DOMAINS, RESOURCE_TYPES, Domain, ResourceType, ViewMode } from '../types'

interface Props {
  activeView: ViewMode
  resourceFilter: ResourceType | 'all'
  domainFilter: Domain | 'all'
  counts: Record<string, number>
  onViewChange: (view: ViewMode) => void
  onResourceFilterChange: (filter: ResourceType | 'all') => void
  onDomainFilterChange: (filter: Domain | 'all') => void
  collapsed: boolean
  onToggle: () => void
}

const VIEW_LABELS: Record<ViewMode, string> = {
  discover: '发现',
  directory: '目录',
  spaces: '空间',
  ai: 'AI',
  inbox: '收件箱',
}

export default function Sidebar({
  activeView,
  resourceFilter,
  domainFilter,
  counts,
  onViewChange,
  onResourceFilterChange,
  onDomainFilterChange,
  collapsed,
  onToggle,
}: Props) {
  if (collapsed) {
    return (
      <aside className="w-16 flex-shrink-0 bg-[#0a0a12] border-r border-white/5 flex flex-col items-center py-4 gap-2">
        <button onClick={onToggle} className="w-9 h-9 rounded-lg text-gray-500 hover:text-white hover:bg-white/5" title="展开">
          ☰
        </button>
        {Object.entries(VIEW_LABELS).map(([id, label]) => (
          <button
            key={id}
            onClick={() => onViewChange(id as ViewMode)}
            className={`w-9 h-9 rounded-lg text-xs ${activeView === id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
            title={label}
          >
            {label.slice(0, 1)}
          </button>
        ))}
      </aside>
    )
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0a0a12] border-r border-white/5 flex flex-col py-5 gap-6">
      <div className="flex items-center justify-between px-4">
        <div>
          <div className="text-sm font-medium text-white">视图</div>
          <div className="text-xs text-gray-600">选择一个工作区</div>
        </div>
        <button onClick={onToggle} className="w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/5" title="收起">
          ‹
        </button>
      </div>

      <nav className="px-4 flex flex-col gap-2">
        {Object.entries(VIEW_LABELS).map(([id, label]) => (
          <button
            key={id}
            onClick={() => onViewChange(id as ViewMode)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${activeView === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg白色/5'}`}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="px-4">
        <div className="mb-2 text-xs font-medium text-gray-500">资源类型</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onResourceFilterChange('all')}
            className={`rounded-full px-2.5 py-1 text-xs ${resourceFilter === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
          >
            全部
          </button>
          {RESOURCE_TYPES.map(item => (
            <button
              key={item.id}
              onClick={() => onResourceFilterChange(item.id)}
              className={`rounded-full px-2.5 py-1 text-xs ${resourceFilter === item.id ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="px-4">
        <div className="mb-2 text-xs font-medium text-gray-500">领域</div>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onDomainFilterChange('all')}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${domainFilter === 'all' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <span>全部领域</span>
            <span className="text-xs text-gray-500">{total}</span>
          </button>
          {DOMAINS.map(item => (
            <button
              key={item.id}
              onClick={() => onDomainFilterChange(item.id)}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${domainFilter === item.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>{item.label}</span>
              <span className="text-xs text-gray-500">{counts[item.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </section>
    </aside>
  )
}
