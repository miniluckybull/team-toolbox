import { ArrowUpRight, Star, Trash2 } from 'lucide-react'
import { TeamResource, getDomainMeta, getResourceMeta } from '../types'

interface Props {
  resource: TeamResource
  isActive?: boolean
  readOnly?: boolean
  onSelect?: (resource: TeamResource) => void
  onToggleFavorite?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ToolCard({
  resource,
  isActive = false,
  readOnly = false,
  onSelect,
  onToggleFavorite,
  onDelete,
}: Props) {
  const resourceMeta = getResourceMeta(resource.resourceType)
  const domainMeta = getDomainMeta(resource.domain)

  const handleSelect = () => {
    onSelect?.(resource)
  }

  const handleToggleFavorite = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (readOnly) return
    onToggleFavorite?.(resource.id)
  }

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (readOnly) return
    onDelete?.(resource.id)
  }

  return (
    <button
      type="button"
      onClick={handleSelect}
      className={`group w-full rounded-2xl border px-4 py-4 text-left transition-all ${
        isActive ? 'border-white/20 bg-white/5' : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${resourceMeta.bgClass} ${resourceMeta.textClass}`}
            >
              {resourceMeta.emoji} {resourceMeta.label}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-gray-400">
              {domainMeta.emoji} {domainMeta.label}
            </span>
            <span className="truncate text-gray-500">{resource.domain}</span>
          </div>

          <div className="mt-1 text-sm font-medium text-white group-hover:text-white/90">{resource.name}</div>
          {resource.tagline ? <div className="mt-1 text-xs text-gray-500">{resource.tagline}</div> : null}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            <span>Owner: {resource.owner}</span>
            <span>Team: {resource.team}</span>
          </div>

          {resource.tasks.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-gray-500">
              {resource.tasks.slice(0, 3).map(task => (
                <span key={task} className="rounded-full bg-white/5 px-2 py-0.5 text-gray-400">
                  {task}
                </span>
              ))}
              {resource.tasks.length > 3 ? <span>+{resource.tasks.length - 3}</span> : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={readOnly}
              className={`rounded-full p-1.5 text-xs text-gray-500 transition hover:text-yellow-300 ${
                resource.favorited ? 'text-yellow-300' : ''
              } ${readOnly ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              <Star className={`h-3.5 w-3.5 ${resource.favorited ? 'fill-current' : ''}`} />
            </button>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-white/10 px-2 py-1 text-xs text-gray-300 transition hover:border-white/20 hover:text-white"
              onClick={event => event.stopPropagation()}
            >
              打开
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </a>
          </div>

          {!readOnly && onDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-gray-400 transition hover:bg-white/10 hover:text-white"
            >
              <Trash2 className="h-3 w-3" /> 移除
            </button>
          ) : null}
        </div>
      </div>
    </button>
  )
}
