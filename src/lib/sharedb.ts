import { TeamResource } from '../types'
import { SEED_RESOURCES } from '../data'

const BIN_ID_KEY = 'toolbox-bin-id'
const ACCESS_KEY_KEY = 'toolbox-access-key'
const MASTER_KEY_KEY = 'toolbox-master-key'
const VERSION_KEY = 'toolbox-bin-version'
const BASE = 'https://api.jsonbin.io/v3/b'

interface JsonBinResponse {
  record?: { tools?: TeamResource[] }
  tools?: TeamResource[]
  metadata?: {
    id?: string
    privateAccessKey?: string
    versioning?: {
      latest?: {
        version?: string
      }
    }
  }
}

function persistBinMeta(metadata?: JsonBinResponse['metadata']) {
  if (!metadata) return
  if (metadata.id) localStorage.setItem(BIN_ID_KEY, metadata.id)
  if (metadata.privateAccessKey) localStorage.setItem(ACCESS_KEY_KEY, metadata.privateAccessKey)
  const version = metadata.versioning?.latest?.version
  if (version) localStorage.setItem(VERSION_KEY, version)
}

function getHeaders(write: boolean) {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Collection-Name': 'team-toolbox',
  }
  const accessKey = localStorage.getItem(ACCESS_KEY_KEY)
  if (accessKey) h['X-Access-Key'] = accessKey
  if (write) {
    const key = localStorage.getItem(MASTER_KEY_KEY)
    if (key) h['X-Master-Key'] = key
    const version = localStorage.getItem(VERSION_KEY)
    if (version) h['If-Match'] = version
  }
  return h
}

function getToolsFromResponse(json: JsonBinResponse): TeamResource[] {
  const tools: TeamResource[] = json.record?.tools ?? json.tools ?? SEED_RESOURCES
  return tools.length ? tools : SEED_RESOURCES
}

export async function loadTools(binId = localStorage.getItem(BIN_ID_KEY) ?? undefined): Promise<TeamResource[]> {
  if (!binId) return SEED_RESOURCES

  try {
    const res = await fetch(`${BASE}/${binId}/latest`, {
      headers: getHeaders(false),
    })
    if (!res.ok) throw new Error('Bin not found')
    const json: JsonBinResponse = await res.json()
    if (binId === localStorage.getItem(BIN_ID_KEY)) persistBinMeta(json.metadata)
    return getToolsFromResponse(json)
  } catch {
    return SEED_RESOURCES
  }
}

export async function saveTools(tools: TeamResource[]): Promise<void> {
  let binId = localStorage.getItem(BIN_ID_KEY)

  if (!binId) {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Collection-Name': 'team-toolbox', 'X-Bin-Private': 'false' },
      body: JSON.stringify({ tools, createdAt: new Date().toISOString() }),
    })
    if (!res.ok) throw new Error('Failed to create shared bin')
    const json: JsonBinResponse = await res.json()
    persistBinMeta(json.metadata)
    return
  }

  const res = await fetch(`${BASE}/${binId}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify({ tools, updatedAt: new Date().toISOString() }),
  })
  if (!res.ok) throw new Error('Failed to save')
  const json: JsonBinResponse = await res.json()
  persistBinMeta(json.metadata)
}

export function getShareUrl(): string | null {
  const binId = localStorage.getItem(BIN_ID_KEY)
  return binId ? `${window.location.origin}?bin=${binId}` : null
}

export function getBinIdFromUrl(): string | null {
  const binId = new URLSearchParams(window.location.search).get('bin')
  return binId?.trim() || null
}

export function hasWriteAccess(): boolean {
  return localStorage.getItem(BIN_ID_KEY) !== null && localStorage.getItem(MASTER_KEY_KEY) !== null
}

export function isShared(): boolean {
  return localStorage.getItem(BIN_ID_KEY) !== null
}
