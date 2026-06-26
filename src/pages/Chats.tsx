import { useEffect, useState, useCallback } from 'react'
import type { BusinessConversation, Message } from '@/types'
import {
  subscribeConversations,
  subscribeMessages,
  subscribeBusinessPhones,
} from '@/lib/db'
import { useBusiness } from '@/context/BusinessContext'
import ConversationList from '@/components/conversations/ConversationList'
import ChatPanel from '@/components/chat/ChatPanel'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PhoneEntry {
  phoneNumberId: string
  phoneNumber: string
  description?: string
}

export default function Chats() {
  const { tieneNegocio, activeBusinessId } = useBusiness()

  const [conversations, setConversations] = useState<Record<
    string,
    BusinessConversation
  > | null>(null)
  const [conversationsLoading, setConversationsLoading] = useState(true)

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)

  const [messages, setMessages] = useState<Record<string, Message> | null>(null)
  const [messagesLoading, setMessagesLoading] = useState(false)

  const [phones, setPhones] = useState<PhoneEntry[]>([])
  const [selectedPhoneId, setSelectedPhoneId] = useState<string>('all')

  useEffect(() => {
    if (!tieneNegocio || !activeBusinessId) {
      setConversations(null)
      setConversationsLoading(false)
      return
    }

    setConversationsLoading(true)
    const unsub = subscribeConversations(activeBusinessId, (data) => {
      setConversations(data as Record<string, BusinessConversation> | null)
      setConversationsLoading(false)
    })

    return unsub
  }, [tieneNegocio, activeBusinessId])

  useEffect(() => {
    if (!activeBusinessId) {
      setPhones([])
      return
    }

    const unsub = subscribeBusinessPhones(activeBusinessId, (data) => {
      if (data) {
        const entries: PhoneEntry[] = Object.entries(data).map(
          ([phoneNumberId, entry]: [string, any]) => ({
            phoneNumberId,
            phoneNumber: entry.phone_number,
            description: entry.description,
          })
        )
        setPhones(entries)
      } else {
        setPhones([])
      }
    })

    return unsub
  }, [activeBusinessId])

  useEffect(() => {
    if (!activeConversationId) {
      setMessages(null)
      return
    }

    setMessagesLoading(true)
    const unsub = subscribeMessages(activeConversationId, (data) => {
      setMessages(data as Record<string, Message> | null)
      setMessagesLoading(false)
    })

    return unsub
  }, [activeConversationId])

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id)
  }, [])

  if (!tieneNegocio) {
    return (
      <div className="flex flex-1 items-center justify-center text-center text-muted-foreground p-6">
        <p>Registra tu negocio primero para conectar tus chats.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-80 shrink-0 flex flex-col border-r border-neutral-200 dark:border-neutral-800">
        {phones.length > 0 && (
          <div className="shrink-0 border-b border-neutral-200 p-3 dark:border-neutral-800">
            <Select
              value={selectedPhoneId}
              onValueChange={(v) => v !== null && setSelectedPhoneId(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los números" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los números</SelectItem>
                {phones.map((p) => (
                  <SelectItem key={p.phoneNumberId} value={p.phoneNumberId}>
                    {p.phoneNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            loading={conversationsLoading}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>
      </div>
      <div className="flex-1">
        <ChatPanel
          messages={messages}
          loading={messagesLoading}
          selectedConversationId={activeConversationId}
        />
      </div>
    </div>
  )
}
