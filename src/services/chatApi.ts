import { auth } from '@/lib/firebase'

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser
  if (!user) throw new Error('Not authenticated')
  const token = await user.getIdToken()
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

async function post(path: string, body: Record<string, unknown>) {
  const headers = await getAuthHeaders()
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function assignConversation(
  businessId: string,
  conversationId: string
) {
  return post('/agent/conversation/assign', { businessId, conversationId })
}

export async function reassignConversation(
  businessId: string,
  conversationId: string,
  targetAgentId: string,
  targetAgentName: string
) {
  return post('/agent/conversation/reassign', {
    businessId,
    conversationId,
    targetAgentId,
    targetAgentName,
  })
}

export async function releaseConversation(
  businessId: string,
  conversationId: string
) {
  return post('/agent/conversation/release', { businessId, conversationId })
}

export async function sendAgentMessage(
  businessId: string,
  conversationId: string,
  phoneNumberId: string,
  waId: string,
  text: string
) {
  console.log('[chatApi] sendAgentMessage payload:', { businessId, conversationId, phoneNumberId, waId, text })
  return post('/agent/message', {
    businessId,
    conversationId,
    phoneNumberId,
    waId,
    text,
  })
}
