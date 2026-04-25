import { useState } from 'react'
import { X, Send, AlertCircle } from 'lucide-react'
import { DOMAINS, Domain, RESOURCE_TYPES, ResourceType, TeamResource } from '../types'

interface Props {
  onAdd: (resource: Omit<TeamResource, 'id' | 'updatedAt'>) => void
  onClose: () => void
}

const EMPTY = {
  name: '',
  tagline: '',
  description: '',
  url: '',
  resourceType: 'link' as ResourceType,
  domain: 'engineering' as Domain,
  tags: '',
  owner: '',
  team: '',
  tasks: '',
  submittedBy: '',
}

export default function AddToolModal({ onAdd, onClose }: Props) {
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = '名称不能为空'
    if (!form.tagline.trim()) e.tagline = '一句话定位不能为空'
    if (!form.url.trim()) e.url = '链接不能为空'
    else {
      try { new URL(form.url) } catch { e.url = '链接格式不正确' }
    }
    if (!form.description.trim()) e.description = '描述不能为空'
    if (!form.owner.trim()) e.owner = '负责人不能为空'
    if (!form.team.trim()) e.team = '团队不能为空'
    return e
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    onAdd({
      name: form.name.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      url: form.url.trim(),
      resourceType: form.resourceType,
      domain: form.domain,
      capabilityLayer: form.resourceType === 'agent' ? 'workflow' : form.resourceType === 'skill' || form.resourceType === 'plugin' ? 'assistant' : 'resource',
      tags: form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      owner: form.owner.trim(),
      team: form.team.trim(),
      visibility: 'team',
      status: 'active',
      spaces: ['engineering-core'],
      tasks: form.tasks.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      submittedBy: form.submittedBy.trim() || undefined,
      actionLabel: '打开资源',
      favorited: false,
      featured: false,
    })
    onClose()
  }

  const set = (k: keyof typeof EMPTY) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [k]: ev.target.value }))
    setErrors(er => {
      const next = { ...er }
      delete next[k]
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#111120] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/6 px-6 py-4">
          <div>
            <h2 className="text-base font-bold text-white">新增能力资源</h2>
            <p className="mt-0.5 text-xs text-gray-600">把工具、AI 能力、脚本或知识资产纳入统一目录</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-500 transition-all hover:bg-white/5 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">资源名称 <span className="text-red-400">*</span></label>
              <input value={form.name} onChange={set('name')} placeholder="例如：Release Agent"
                className={`w-full rounded-xl border bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors ${errors.name ? 'border-red-500/50' : 'border-white/8'}`} />
              {errors.name && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">一句话定位 <span className="text-red-400">*</span></label>
              <input value={form.tagline} onChange={set('tagline')} placeholder="例如：自动整理发布说明"
                className={`w-full rounded-xl border bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors ${errors.tagline ? 'border-red-500/50' : 'border-white/8'}`} />
              {errors.tagline && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{errors.tagline}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">资源类型</label>
              <select value={form.resourceType} onChange={set('resourceType')} className="w-full rounded-xl border border-white/8 bg-[#0a0a12] px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors">
                {RESOURCE_TYPES.map(item => <option key={item.id} value={item.id}>{item.emoji} {item.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">任务场景</label>
              <select value={form.domain} onChange={set('domain')} className="w-full rounded-xl border border-white/8 bg-[#0a0a12] px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-colors">
                {DOMAINS.map(item => <option key={item.id} value={item.id}>{item.emoji} {item.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">入口链接 <span className="text-red-400">*</span></label>
            <input value={form.url} onChange={set('url')} placeholder="https://..."
              className={`w-full rounded-xl border bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors ${errors.url ? 'border-red-500/50' : 'border-white/8'}`} />
            {errors.url && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{errors.url}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">资源描述 <span className="text-red-400">*</span></label>
            <textarea value={form.description} onChange={set('description')} rows={4} placeholder="说明它解决什么问题、适合谁、怎么接入..."
              className={`w-full resize-none rounded-xl border bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors ${errors.description ? 'border-red-500/50' : 'border-white/8'}`} />
            {errors.description && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{errors.description}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Owner <span className="text-red-400">*</span></label>
              <input value={form.owner} onChange={set('owner')} placeholder="例如：AI 平台组"
                className={`w-full rounded-xl border bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors ${errors.owner ? 'border-red-500/50' : 'border-white/8'}`} />
              {errors.owner && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{errors.owner}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">团队 <span className="text-red-400">*</span></label>
              <input value={form.team} onChange={set('team')} placeholder="例如：Platform"
                className={`w-full rounded-xl border bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors ${errors.team ? 'border-red-500/50' : 'border-white/8'}`} />
              {errors.team && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{errors.team}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">标签</label>
              <input value={form.tags} onChange={set('tags')} placeholder="例如：AI, 自动化, 协作"
                className="w-full rounded-xl border border-white/8 bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">适用任务</label>
              <input value={form.tasks} onChange={set('tasks')} placeholder="例如：发布说明, 知识同步"
                className="w-full rounded-xl border border-white/8 bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-400">提交人</label>
            <input value={form.submittedBy} onChange={set('submittedBy')} placeholder="你的名字"
              className="w-full rounded-xl border border-white/8 bg-[#0a0a12] px-3 py-2 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-cyan-500/50 transition-colors" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-400 transition-all hover:border-white/20 hover:text-white">取消</button>
            <button type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90">
              <Send className="w-3.5 h-3.5" /> 添加到平台
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
