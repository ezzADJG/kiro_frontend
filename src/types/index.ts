// ─── Business ──────────────────────────────────────────────────
export interface Business {
  name: string
  slug: string
  industry: string
  country: string
  timezone: string
  phoneNumberId: string
  status: BusinessStatus
  createdAt: number
  updatedAt: number
}

export type BusinessStatus = 'active' | 'suspended' | 'inactive'

// ─── Phone ─────────────────────────────────────────────────────
export interface Phone {
  businessId: string
  phoneNumber: string
}

export interface PhoneRegistryEntry {
  name: string
  phoneNumberId: string
}

// ─── User ──────────────────────────────────────────────────────
export interface User {
  displayName: string
  email: string
  avatarUrl: string | null
  status: UserStatus
  createdAt: number
}

export type UserStatus = 'active' | 'inactive'

// ─── BusinessUser (lookup invertido) ───────────────────────────
export interface UserBusiness {
  businessId: string
  role: BusinessRole
}

// ─── BusinessUser (perfil por negocio) ─────────────────────────
export interface BusinessUser {
  role: BusinessRole
  active: boolean
  joinedAt: number
}

export type BusinessRole = 'owner' | 'agente'

// ─── Customer ──────────────────────────────────────────────────
export interface Customer {
  displayName: string
  profileName: string
  source: CustomerSource
  firstSeenAt: number
  lastSeenAt: number
}

export type CustomerSource = 'whatsapp' | 'web' | 'instagram' | 'manual'

// ─── Conversation (en businessConversations) ───────────────────
export interface BusinessConversation {
  assignedTo: string
  assignedToName: string
  assignedAt: number
  channel: ConversationChannel
  customerId: string
  customerName: string
  customerPhone: string
  lastMessageAt: number
  lastMessageDirection: MessageDirection
  lastMessageText: string
  mode: ConversationMode
  priority: ConversationPriority
  status: ConversationStatus
  unreadCount: number
  phoneNumberId?: string
}

export interface Conversation {
  assignedTo: string
  assignedToName: string
  assignedAt: number
  businessId: string
  channel: ConversationChannel
  createdAt: number
  customerId: string
  lastMessageAt: number
  lastMessageDirection: MessageDirection
  lastMessageText: string
  mode: ConversationMode
  priority: ConversationPriority
  status: ConversationStatus
  unreadCount: number
  updatedAt: number
}

export type ConversationChannel = 'whatsapp'
export type ConversationMode = 'bot' | 'agent'
export type ConversationPriority = 'normal' | 'high' | 'urgent'
export type ConversationStatus = 'open' | 'closed' | 'pending'

// ─── Message ───────────────────────────────────────────────────
export interface Message {
  businessId: string
  createdAt: number
  direction: MessageDirection
  metaMessageId: string
  senderId: string
  senderType: SenderType
  senderName?: string
  status: MessageStatus
  content: string
  type: MessageType
}

export type MessageDirection = 'inbound' | 'outbound'
export type SenderType = 'customer' | 'bot' | 'agent'
export type MessageStatus = 'sent' | 'received' | 'read' | 'failed'
export type MessageType = 'text' | 'image' | 'audio' | 'document' | 'interactive'

export type BusinessType = 'restaurant' | 'retail' | 'services' | 'salon' | 'other'

export interface ProductItem {
  id: string
  name: string
  price: number
  category?: string
  stock?: number
  description?: string
  businessType: BusinessType
}

export interface BusinessProduct {
  activo: boolean
  createdAt: number
  updatedAt: number
  [key: string]: string | number | boolean | undefined
}

export interface BusinessService {
  name: string
  price: number
  durationMinutes: number
  active: boolean
  description?: string
  category?: string
  createdAt: number
  updatedAt: number
}
