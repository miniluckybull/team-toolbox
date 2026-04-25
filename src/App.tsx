import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import ToolCard from './components/ToolCard'
import AddToolModal from './components/AddToolModal'
import { TEAM_COLLECTIONS, TEAM_SPACES, SEED_RESOURCES, SEED_SUBMISSIONS } from './data'
import {
  Collection,
  Domain,
  LegacyToolRecord,
  ResourceType,
  Submission,
  TeamResource,
  ViewMode,
  getDomainMeta,
  getResourceMeta,
} from './types'
import { getBinIdFromUrl, getShareUrl, hasWriteAccess, loadTools, saveTools, isShared } from './lib/sharedb'
import { CheckCircle2, Inbox, Layers3, Loader2, Package, Wifi, XCircle } from 'lucide-react'
import { useLocalStorage } from './hooks/useLocalStorage'

const AI_RESOURCE_TYPES: ResourceType[] = ['skill', 'agent', 'plugin']

function countByDomain(resources: TeamResource[]) {
  const counts: Record<string, number> = {}
  for (const item of resources) counts[item.domain] = (counts[item.domain] ?? 0) + 1
  return counts
}

function mapLegacyCategory(category?: string): { resourceType: ResourceType; domain: Domain } {
  switch (category) {
    case 'websites':
      return { resourceType: 'link', domain: 'knowledge' }
    case 'software':
    case 'tools':
      return { resourceType: 'desktop', domain: 'engineering' }
    case 'skills':
      return { resourceType: 'skill', domain: 'ai-workspace' }
    case 'plugins':
      return { resourceType: 'plugin', domain: 'collaboration' }
    case 'scripts':
      return { resourceType: 'script', domain: 'operations' }
    case 'files':
      return { resourceType: 'file', domain: 'knowledge' }
    default:
      return { resourceType: 'link', domain: 'engineering' }
  }
}

function normalizeResource(input: TeamResource | LegacyToolRecord): TeamResource {
  if ('resourceType' in input && 'updatedAt' in input) {
    return {
      ...input,
      tags: input.tags ?? [],
      tasks: input.tasks ?? [],
      spaces: input.spaces ?? [],
      owner: input.owner ?? input.submittedBy ?? '未分配',
      team: input.team ?? 'Unassigned',
      visibility: input.visibility ?? 'team',
      status: input.status ?? 'active',
      tagline: input.tagline ?? input.description,
      capabilityLayer: input.capabilityLayer ?? 'resource',
      updatedAt: input.updatedAt ?? new Date().toISOString().split('T')[0],
    }
  }

  const mapped = mapLegacyCategory(input.category)
  const updatedAt = input.createdAt ?? new Date().toISOString().split('T')[0]
  return {
    id: input.id,
    name: input.name,
    tagline: input.description,
    description: input.description,
    resourceType: mapped.resourceType,
    domain: mapped.domain,
    capabilityLayer:
      mapped.resourceType === 'skill' || mapped.resourceType === 'plugin'
        ? 'assistant'
        : mapped.resourceType === 'script'
        ? 'workflow'
        : 'resource',
    url: input.url,
    tags: input.tags ?? [],
    owner: input.submittedBy ?? '历史迁移',
    team: 'Migrated',
    visibility: 'team',
    status: 'active',
    spaces: ['engineering-core'],
    tasks: [],
    submittedBy: input.submittedBy,
    updatedAt,
    favorited: input.favorited,
    actionLabel: '打开资源',
  }
}

function createResourceFromSubmission(resource: Omit<TeamResource, 'id' | 'updatedAt'>): TeamResource {
  return {
    ...resource,
    id: `${Date.now()}`,
    updatedAt: new Date().toISOString().split('T')[0],
  }
}

function formatDate(input: string) {
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return input
  return date.toLocaleDateString('zh-CN')
}

function isAiResource(resource: TeamResource) {
  return AI_RESOURCE_TYPES.includes(resource.resourceType)
}

export default function App() {
  const [resources, setResources] = useLocalStorage<TeamResource[]>('toolbox-local-tools', [])
  const [submissions, setSubmissions] = useLocalStorage<Submission[]>('toolbox-local-submissions', [])
  const [activeView, setActiveView] = useState<ViewMode>('discover')
  const [resourceFilter, setResourceFilter] = useState<ResourceType | 'all'>('all')
  const [domainFilter, setDomainFilter] = useState<Domain | 'all'>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(false)
  const [readOnlyShared, setReadOnlyShared] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [selectedResource, setSelectedResource] = useState<TeamResource | null>(null)
  const [toastMsg, setToastMsg] = useState('')
  const [activeSpaceId, setActiveSpaceId] = useState<string>(TEAM_SPACES[0]?.id ?? '')
  const [activeCollectionId, setActiveCollectionId] = useState<string | 'all'>('all')

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const sharedBinId = getBinIdFromUrl()
        if (sharedBinId) {
          const data = (await loadTools(sharedBinId)).map(normalizeResource)
          setResources(data)
          setIsOnline(true)
          setReadOnlyShared(sharedBinId !== localStorage.getItem('toolbox-bin-id') || !hasWriteAccess())
          setShareUrl(`${window.location.origin}?bin=${sharedBinId}`)
          setSubmissions([])
        } else if (isShared()) {
          const data = (await loadTools()).map(normalizeResource)
          setResources(data)
          setIsOnline(true)
          setReadOnlyShared(!hasWriteAccess())
          setShareUrl(getShareUrl())
          setSubmissions([])
        } else {
          setResources(SEED_RESOURCES.map(normalizeResource))
          setShareUrl(null)
          setReadOnlyShared(false)
          setSubmissions(prev => (prev.length ? prev : SEED_SUBMISSIONS))
        }
      } catch {
        setResources(SEED_RESOURCES.map(normalizeResource))
        setShareUrl(null)
        setReadOnlyShared(false)
        setSubmissions(prev => (prev.length ? prev : SEED_SUBMISSIONS))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [setResources, setSubmissions])

  useEffect(() => {
    if (loading || !isOnline || readOnlyShared) return
    saveTools(resources).catch(() => showToast('同步失败，请稍后重试'))
  }, [resources, loading, isOnline, readOnlyShared, showToast])

  useEffect(() => {
    if (selectedResource && !resources.some(item => item.id === selectedResource.id)) {
      setSelectedResource(null)
    }
  }, [resources, selectedResource])

  useEffect(() => {
    setActiveCollectionId('all')
  }, [activeSpaceId])

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase()
    return resources
      .filter(resource => {
        const matchType = resourceFilter === 'all' || resource.resourceType === resourceFilter
        const matchDomain = domainFilter === 'all' || resource.domain === domainFilter
        const matchSearch =
          !q ||
          resource.name.toLowerCase().includes(q) ||
          resource.tagline.toLowerCase().includes(q) ||
          resource.description.toLowerCase().includes(q) ||
          resource.tags.some(tag => tag.toLowerCase().includes(q)) ||
          resource.tasks.some(task => task.toLowerCase().includes(q)) ||
          resource.team.toLowerCase().includes(q)
        if (activeView === 'ai' && !isAiResource(resource)) return false
        return matchType && matchDomain && matchSearch
      })
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        if (a.favorited && !b.favorited) return -1
        if (!a.favorited && b.favorited) return 1
        return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')
      })
  }, [resources, activeView, resourceFilter, domainFilter, search])

  const counts = useMemo(() => countByDomain(resources), [resources])
  const recentResources = useMemo(() => [...resources].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')).slice(0, 6), [resources])
  const aiHighlights = useMemo(() => resources.filter(isAiResource).slice(0, 6), [resources])
  const pendingSubmissions = useMemo(() => submissions.filter(item => item.status === 'pending'), [submissions])
  const pendingCount = pendingSubmissions.length
  const spaceNameMap = useMemo(() => new Map(TEAM_SPACES.map(space => [space.id, space.name])), [])

  const spaceCollections = useMemo(() => TEAM_COLLECTIONS.filter(collection => collection.spaceId === activeSpaceId), [activeSpaceId])
  const spaceResources = useMemo(() => resources.filter(resource => resource.spaces.includes(activeSpaceId)), [resources, activeSpaceId])
  const collectionResources = useMemo(() => {
    if (activeCollectionId === 'all' || !activeCollectionId) return spaceResources
    const collection = TEAM_COLLECTIONS.find(item => item.id === activeCollectionId)
    if (!collection) return spaceResources
    return spaceResources.filter(resource => collection.resourceIds.includes(resource.id))
  }, [spaceResources, activeCollectionId])

  const handleReadOnlyAction = useCallback(() => {
    showToast('当前是共享只读视图，无法修改能力平台')
  }, [showToast])

  const handleCopyShareUrl = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('分享链接已复制')
    } catch {
      showToast('复制失败，请手动复制链接')
    }
  }, [shareUrl, showToast])

  const handleAdd = async (resource: Omit<TeamResource, 'id' | 'updatedAt'>) => {
    if (readOnlyShared) {
      handleReadOnlyAction()
      return
    }
    const submission: Submission = {
      id: `sub-${Date.now()}`,
      resource,
      submittedAt: new Date().toISOString(),
      submittedBy: resource.submittedBy ?? '匿名提交',
      status: 'pending',
    }
    setSubmissions(prev => [submission, ...prev])
    setActiveView('inbox')
    showToast('已提交到收件箱，待审核后加入目录')
  }

  const handleDelete = (id: string) => {
    if (readOnlyShared) {
      handleReadOnlyAction()
      return
    }
    if (!confirm('确定要删除这个资源吗？')) return
    setResources(prev => prev.filter(item => item.id !== id))
    if (selectedResource?.id === id) setSelectedResource(null)
    showToast(isOnline ? '资源已删除并同步' : '资源已删除')
  }

  const handleToggleFavorite = (id: string) => {
    if (readOnlyShared) {
      handleReadOnlyAction()
      return
    }
    setResources(prev => prev.map(item => (item.id === id ? { ...item, favorited: !item.favorited } : item)))
  }

  const handleBecomeShared = async () => {
    if (readOnlyShared) {
      handleReadOnlyAction()
      return
    }
    try {
      await saveTools(resources)
      setIsOnline(true)
      setReadOnlyShared(!hasWriteAccess())
      setShareUrl(getShareUrl())
      showToast('已创建共享能力空间，链接可分享给团队！')
    } catch {
      showToast('创建共享失败，请重试')
    }
  }

  const handleApproveSubmission = (id: string) => {
    if (readOnlyShared) {
      handleReadOnlyAction()
      return
    }
    const submission = submissions.find(item => item.id === id)
    if (!submission) return
    const resource = createResourceFromSubmission(submission.resource)
    setResources(prev => [resource, ...prev])
    setSubmissions(prev => prev.filter(item => item.id !== id))
    setSelectedResource(resource)
    setActiveView('directory')
    showToast('提交已通过并加入目录')
  }

  const handleRejectSubmission = (id: string) => {
    if (readOnlyShared) {
      handleReadOnlyAction()
      return
    }
    setSubmissions(prev => prev.filter(item => item.id !== id))
    showToast('提交已移除')
  }

  const renderDiscoverView = () => (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>能力总览</span>
            <Layers3 className="h-3.5 w-3.5 text-gray-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{resources.length}</div>
          <p className="mt-1 text-xs text-gray-600">覆盖 {Object.keys(counts).length} 个任务领域</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>AI 能力</span>
            <Inbox className="h-3.5 w-3.5 text-gray-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{aiHighlights.length}</div>
          <p className="mt-1 text-xs text-gray-600">技能 / Agents / 插件集中管理</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>待处理</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-gray-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold text-white">{pendingCount}</div>
          <p className="mt-1 text-xs text-gray-600">收件箱内待审核的提交</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">最近更新</h3>
            <button onClick={() => setActiveView('directory')} className="text-xs text-cyan-400 hover:text-cyan-300">
              查看目录
            </button>
          </div>
          <div className="space-y-3">
            {recentResources.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-gray-500">
                尚无资源，尝试添加或从收件箱审批
              </div>
            ) : (
              recentResources.map(resource => (
                <ToolCard
                  key={resource.id}
                  resource={resource}
                  isActive={selectedResource?.id === resource.id}
                  onSelect={setSelectedResource}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                  readOnly={readOnlyShared}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">AI 能力精选</h3>
            <button onClick={() => setActiveView('ai')} className="text-xs text-cyan-400 hover:text-cyan-300">
              进入 AI 中心
            </button>
          </div>
          <div className="space-y-3">
            {aiHighlights.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center text-sm text-gray-500">
                暂无 AI 资产，可以从收件箱批量引入
              </div>
            ) : (
              aiHighlights.map(resource => (
                <ToolCard
                  key={resource.id}
                  resource={resource}
                  isActive={selectedResource?.id === resource.id}
                  onSelect={setSelectedResource}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                  readOnly={readOnlyShared}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )

  const renderDirectoryView = () => (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">能力目录</h3>
        <p className="text-xs text-gray-600 mt-1">按资源类型、任务领域和标签快速定位</p>
      </div>
      {filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-white/8 bg-white/[0.02] p-12 text-center">
          <Package className="mb-4 h-10 w-10 text-gray-700" />
          <p className="text-sm text-gray-500">没有找到相关资源</p>
          <p className="mt-1 text-xs text-gray-600">试试调整筛选条件或者在收件箱审批资源</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filteredResources.map(resource => (
            <ToolCard
              key={resource.id}
              resource={resource}
              isActive={selectedResource?.id === resource.id}
              onSelect={setSelectedResource}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              readOnly={readOnlyShared}
            />
          ))}
        </div>
      )}
    </section>
  )

  const renderSpacesView = () => {
    const currentSpace = TEAM_SPACES.find(space => space.id === activeSpaceId)

    if (!currentSpace) {
      return (
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-10 text-center text-sm text-gray-500">
          暂无空间配置
        </div>
      )
    }

    return (
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-white/8 bg-white/[0.02] p-3">
          <div className="mb-2 text-xs font-semibold text-gray-500">空间</div>
          <div className="flex flex-col gap-1">
            {TEAM_SPACES.map(space => (
              <button
                key={space.id}
                onClick={() => setActiveSpaceId(space.id)}
                className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                  activeSpaceId === space.id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {space.name}
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-5">
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-white">{currentSpace.name}</h3>
                <p className="mt-1 text-xs text-gray-500">{currentSpace.description}</p>
              </div>
              <div className="text-xs text-gray-500">
                {currentSpace.memberCount} 位成员 · {currentSpace.resourceCount} 个资源
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold text-gray-500">资源集合</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCollectionId('all')}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  activeCollectionId === 'all' ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                全部
              </button>
              {spaceCollections.map((collection: Collection) => (
                <button
                  key={collection.id}
                  onClick={() => setActiveCollectionId(collection.id)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    activeCollectionId === collection.id ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {collectionResources.length === 0 ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-8 text-center text-sm text-gray-500">
                当前集合下暂无资源
              </div>
            ) : (
              collectionResources.map(resource => (
                <ToolCard
                  key={resource.id}
                  resource={resource}
                  isActive={selectedResource?.id === resource.id}
                  onSelect={setSelectedResource}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                  readOnly={readOnlyShared}
                />
              ))
            )}
          </div>
        </section>
      </div>
    )
  }

  const renderAiView = () => (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">AI 能力中心</h3>
        <p className="mt-1 text-xs text-gray-600">聚焦技能、Agents、插件等智能能力的归档与交付方式</p>
      </div>
      {filteredResources.length === 0 ? (
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-10 text-center text-sm text-gray-500">
          暂无符合条件的 AI 能力
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filteredResources.map(resource => (
            <ToolCard
              key={resource.id}
              resource={resource}
              isActive={selectedResource?.id === resource.id}
              onSelect={setSelectedResource}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              readOnly={readOnlyShared}
            />
          ))}
        </div>
      )}
    </section>
  )

  const renderInboxView = () => (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">收件箱</h3>
          <p className="mt-1 text-xs text-gray-600">审核队友提交的能力，批准后加入正式目录</p>
        </div>
        {readOnlyShared && (
          <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] text-gray-400">只读模式无法处理</span>
        )}
      </div>

      {pendingSubmissions.length === 0 ? (
        <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-10 text-center text-sm text-gray-500">
          当前没有待处理提交
        </div>
      ) : (
        <div className="space-y-3">
          {pendingSubmissions.map(submission => (
            <div key={submission.id} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{submission.resource.name}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {submission.resource.tagline || '——'}
                  </div>
                  <div className="mt-2 text-[11px] text-gray-500">
                    提交人：{submission.submittedBy} · {formatDate(submission.submittedAt)}
                  </div>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-gray-400">待审核</span>
              </div>

              <div className="mt-3 text-sm text-gray-400 leading-6">{submission.resource.description}</div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                <span>
                  类型：{getResourceMeta(submission.resource.resourceType).label}
                </span>
                <span>
                  领域：{getDomainMeta(submission.resource.domain).label}
                </span>
                {submission.resource.tasks.length ? (
                  <span>适用：{submission.resource.tasks.join(' · ')}</span>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => handleApproveSubmission(submission.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-500/30"
                  disabled={readOnlyShared}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> 批准加入
                </button>
                <button
                  onClick={() => handleRejectSubmission(submission.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs text-gray-400 transition hover:bg-white/15 hover:text-white"
                  disabled={readOnlyShared}
                >
                  <XCircle className="h-3.5 w-3.5" /> 移除
                </button>
                <a
                  href={submission.resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1.5 text-xs text-gray-300 transition hover:border-white/20 hover:text-white"
                >
                  查看链接
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-sm text-gray-500">加载能力平台...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f] text-white">
      <Sidebar
        activeView={activeView}
        resourceFilter={resourceFilter}
        domainFilter={domainFilter}
        counts={counts}
        onViewChange={setActiveView}
        onResourceFilterChange={setResourceFilter}
        onDomainFilterChange={setDomainFilter}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(prev => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            search={search}
            onSearch={setSearch}
            onAdd={() => setShowModal(true)}
            isOnline={isOnline}
            readOnlyShared={readOnlyShared}
            shareUrl={shareUrl}
            activeView={activeView}
            onViewChange={setActiveView}
            onBecomeShared={handleBecomeShared}
            onCopyShareUrl={handleCopyShareUrl}
            pendingCount={pendingCount}
          />

          <main className="flex-1 overflow-y-auto p-6">
            {isOnline && (
              <div className="mb-5 flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-500/8 px-4 py-3 text-xs text-cyan-300">
                <Wifi className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  {readOnlyShared
                    ? '当前为共享只读空间，可浏览团队能力目录。'
                    : '共享协作已开启，当前空间中的能力资源会同步给团队成员。'}
                </span>
              </div>
            )}

            {activeView === 'discover' && renderDiscoverView()}
            {activeView === 'directory' && renderDirectoryView()}
            {activeView === 'spaces' && renderSpacesView()}
            {activeView === 'ai' && renderAiView()}
            {activeView === 'inbox' && renderInboxView()}
          </main>
        </div>

        <aside className="hidden w-[360px] flex-shrink-0 border-l border-white/5 bg-[#0b0b12] p-5 2xl:flex">
          <div className="w-full">
            <div className="mb-4 text-sm font-semibold text-white">资源详情</div>
            {selectedResource ? (
              <div className="rounded-3xl border border-white/8 bg-[#111118] p-5">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${getResourceMeta(selectedResource.resourceType).bgClass} ${getResourceMeta(selectedResource.resourceType).textClass}`}
                  >
                    {getResourceMeta(selectedResource.resourceType).emoji} {getResourceMeta(selectedResource.resourceType).label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                    {getDomainMeta(selectedResource.domain).emoji} {getDomainMeta(selectedResource.domain).label}
                  </span>
                  {selectedResource.visibility !== 'team' ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-gray-400">
                      可见性：{selectedResource.visibility}
                    </span>
                  ) : null}
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-semibold text-white">{selectedResource.name}</h3>
                  {selectedResource.tagline && <p className="mt-1 text-sm text-cyan-300">{selectedResource.tagline}</p>}
                  <p className="mt-3 text-sm leading-6 text-gray-400">{selectedResource.description}</p>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  {selectedResource.tasks.length ? (
                    <div>
                      <div className="text-xs text-gray-500">适用任务</div>
                      <div className="text-white/90">{selectedResource.tasks.join(' · ')}</div>
                    </div>
                  ) : null}
                  <div>
                    <div className="text-xs text-gray-500">维护团队</div>
                    <div className="text-white/90">
                      {selectedResource.owner} · {selectedResource.team}
                    </div>
                  </div>
                  {selectedResource.tags.length ? (
                    <div>
                      <div className="text-xs text-gray-500">标签</div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                        {selectedResource.tags.map(tag => (
                          <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <div className="text-xs text-gray-500">归属空间</div>
                    <div className="text-white/90">
                      {selectedResource.spaces.map(spaceId => spaceNameMap.get(spaceId) ?? spaceId).join(' · ')}
                    </div>
                  </div>
                  {selectedResource.integrations?.length ? (
                    <div>
                      <div className="text-xs text-gray-500">集成能力</div>
                      <div className="text-white/90">{selectedResource.integrations.join(' · ')}</div>
                    </div>
                  ) : null}
                  {selectedResource.surfaces?.length ? (
                    <div>
                      <div className="text-xs text-gray-500">使用入口</div>
                      <div className="text-white/90">{selectedResource.surfaces.join(' · ')}</div>
                    </div>
                  ) : null}
                </div>

                {isAiResource(selectedResource) ? (
                  <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
                    <div className="text-xs font-semibold text-cyan-300">AI 能力详情</div>
                    {selectedResource.aiType ? (
                      <div className="text-sm text-white/90">类型：{selectedResource.aiType.toUpperCase()}</div>
                    ) : null}
                    {selectedResource.modelOrRuntime ? (
                      <div className="text-sm text-white/90">模型 / Runtime：{selectedResource.modelOrRuntime}</div>
                    ) : null}
                    {selectedResource.invocationMethod ? (
                      <div className="text-sm text-white/90">调用方式：{selectedResource.invocationMethod}</div>
                    ) : null}
                    {selectedResource.aiInputs?.length ? (
                      <div>
                        <div className="text-xs text-gray-500">输入</div>
                        <ul className="mt-1 space-y-1 text-sm text-white/90">
                          {selectedResource.aiInputs.map(item => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {selectedResource.aiOutputs?.length ? (
                      <div>
                        <div className="text-xs text-gray-500">输出</div>
                        <ul className="mt-1 space-y-1 text-sm text-white/90">
                          {selectedResource.aiOutputs.map(item => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {selectedResource.permissions?.length ? (
                      <div>
                        <div className="text-xs text-gray-500">权限要求</div>
                        <ul className="mt-1 space-y-1 text-sm text-white/90">
                          {selectedResource.permissions.map(item => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {selectedResource.relatedResources?.length ? (
                      <div>
                        <div className="text-xs text-gray-500">关联资源</div>
                        <div className="text-sm text-white/90">{selectedResource.relatedResources.join(' · ')}</div>
                      </div>
                    ) : null}
                    {selectedResource.examples?.length ? (
                      <div>
                        <div className="text-xs text-gray-500">使用示例</div>
                        <ul className="mt-1 space-y-1 text-sm text-white/90">
                          {selectedResource.examples.map(item => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={selectedResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 px-3 py-1.5 text-xs text-cyan-300 transition hover:border-cyan-500/40 hover:text-white"
                  >
                    {selectedResource.actionLabel ?? '打开链接'}
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/8 bg-[#111118] p-5 text-sm text-gray-500 leading-6">
                从左侧列表中选择一个资源，即可查看它的任务场景、维护团队、空间归属与 AI 能力详情。
                <div className="mt-4 space-y-2">
                  {recentResources.map(resource => (
                    <button
                      key={resource.id}
                      onClick={() => setSelectedResource(resource)}
                      className="block w-full rounded-2xl bg-white/4 px-4 py-3 text-left text-white/85 transition hover:bg-white/6"
                    >
                      <div className="text-sm">{resource.name}</div>
                      <div className="text-xs text-gray-500">更新于 {resource.updatedAt}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {showModal && !readOnlyShared && <AddToolModal onAdd={handleAdd} onClose={() => setShowModal(false)} />}

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-cyan-500/30 bg-[#111120] px-4 py-2.5 text-sm text-cyan-400 shadow-xl backdrop-blur-md">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
