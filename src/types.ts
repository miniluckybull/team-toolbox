export type ResourceType =
  | 'link'
  | 'webapp'
  | 'desktop'
  | 'skill'
  | 'agent'
  | 'plugin'
  | 'script'
  | 'file'
  | 'playbook'

export type Domain =
  | 'engineering'
  | 'ai-workspace'
  | 'collaboration'
  | 'operations'
  | 'knowledge'

export type Visibility = 'public' | 'team' | 'restricted'
export type ResourceStatus = 'recommended' | 'active' | 'beta' | 'archived'
export type CapabilityLayer = 'resource' | 'workflow' | 'assistant' | 'knowledge'
export type ViewMode = 'discover' | 'directory' | 'spaces' | 'ai' | 'inbox'

export type SubmissionStatus = 'pending' | 'approved' | 'rejected'

export interface ResourceMeta {
  id: ResourceType
  label: string
  emoji: string
  bgClass: string
  textClass: string
}

export interface DomainMeta {
  id: Domain
  label: string
  emoji: string
}

export interface LegacyToolRecord {
  id: string
  name: string
  description: string
  category?: string
  url: string
  tags?: string[]
  submittedBy?: string
  createdAt?: string
  favorited?: boolean
}

export interface TeamResource {
  id: string
  name: string
  tagline: string
  description: string
  resourceType: ResourceType
  domain: Domain
  capabilityLayer: CapabilityLayer
  url: string
  tags: string[]
  owner: string
  team: string
  visibility: Visibility
  status: ResourceStatus
  spaces: string[]
  tasks: string[]
  integrations?: string[]
  surfaces?: string[]
  submittedBy?: string
  updatedAt: string
  featured?: boolean
  favorited?: boolean
  aiType?: 'skill' | 'agent' | 'plugin' | 'prompt-kit'
  aiInputs?: string[]
  aiOutputs?: string[]
  modelOrRuntime?: string
  invocationMethod?: string
  permissions?: string[]
  relatedResources?: string[]
  examples?: string[]
  actionLabel?: string
}

export interface Space {
  id: string
  name: string
  description: string
  lead: string
  memberCount: number
  resourceCount: number
  theme: string
}

export interface Collection {
  id: string
  spaceId: string
  name: string
  description: string
  owner: string
  resourceIds: string[]
}

export interface Submission {
  id: string
  resource: Omit<TeamResource, 'id' | 'updatedAt'>
  submittedAt: string
  submittedBy: string
  status: SubmissionStatus
}

export const RESOURCE_TYPES: ResourceMeta[] = [
  { id: 'link', label: '链接', emoji: '🔗', bgClass: 'bg-blue-500/10', textClass: 'text-blue-400' },
  { id: 'webapp', label: 'Web 应用', emoji: '🌐', bgClass: 'bg-cyan-500/10', textClass: 'text-cyan-400' },
  { id: 'desktop', label: '桌面程序', emoji: '💻', bgClass: 'bg-violet-500/10', textClass: 'text-violet-400' },
  { id: 'skill', label: 'Skill', emoji: '🧩', bgClass: 'bg-emerald-500/10', textClass: 'text-emerald-400' },
  { id: 'agent', label: 'Agent', emoji: '🤖', bgClass: 'bg-fuchsia-500/10', textClass: 'text-fuchsia-400' },
  { id: 'plugin', label: '插件', emoji: '🔌', bgClass: 'bg-orange-500/10', textClass: 'text-orange-400' },
  { id: 'script', label: '脚本', emoji: '📜', bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  { id: 'file', label: '文件', emoji: '📁', bgClass: 'bg-slate-500/10', textClass: 'text-slate-400' },
  { id: 'playbook', label: 'Playbook', emoji: '🗂️', bgClass: 'bg-pink-500/10', textClass: 'text-pink-400' },
]

export const DOMAINS: DomainMeta[] = [
  { id: 'engineering', label: '研发工程', emoji: '🛠️' },
  { id: 'ai-workspace', label: 'AI 工作台', emoji: '✨' },
  { id: 'collaboration', label: '团队协作', emoji: '🤝' },
  { id: 'operations', label: '运营交付', emoji: '📈' },
  { id: 'knowledge', label: '知识资产', emoji: '📚' },
]

export function getResourceMeta(id: ResourceType): ResourceMeta {
  return RESOURCE_TYPES.find(item => item.id === id) ?? RESOURCE_TYPES[0]
}

export function getDomainMeta(id: Domain): DomainMeta {
  return DOMAINS.find(item => item.id === id) ?? DOMAINS[0]
}
