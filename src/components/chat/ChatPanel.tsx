import { useRef, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import type { Message, BusinessConversation } from '@/types'
import MessageBubble from './MessageBubble'
import ConversationHeader from './ConversationHeader'
import ChatInput from './ChatInput'

interface ChatPanelProps {
  messages: Record<string, Message> | null
  loading: boolean
  selectedConversationId: string | null
  conversation: BusinessConversation | null
  currentUserId: string | null
  onAssign: () => void
  onReassign: () => void
  onRelease: () => void
  onSendMessage: (text: string) => Promise<void>
  canSend: boolean
}

function SkeletonBubble({ align }: { align: 'left' | 'right' }) {
  return (
    <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`h-12 w-56 animate-pulse rounded-2xl ${
          align === 'right'
            ? 'rounded-br-sm bg-blue-200 dark:bg-blue-800'
            : 'rounded-bl-sm bg-neutral-200 dark:bg-neutral-700'
        }`}
      />
    </div>
  )
}

function SkeletonMessages() {
  return (
    <div className="flex flex-col gap-3 p-6">
      <SkeletonBubble align="left" />
      <SkeletonBubble align="left" />
      <SkeletonBubble align="right" />
      <SkeletonBubble align="left" />
      <SkeletonBubble align="right" />
      <SkeletonBubble align="right" />
      <SkeletonBubble align="left" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-400">
      <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
        <MessageSquare className="h-8 w-8" />
      </div>
      <p className="text-sm">Selecciona una conversación</p>
    </div>
  )
}

export default function ChatPanel({
  messages,
  loading,
  selectedConversationId,
  conversation,
  currentUserId,
  onAssign,
  onReassign,
  onRelease,
  onSendMessage,
  canSend,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const messageEntries = messages
    ? Object.entries(messages).sort(([, a], [, b]) => a.createdAt - b.createdAt)
    : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messageEntries.length])

  if (!selectedConversationId) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-neutral-950">
        <EmptyState />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-white dark:bg-neutral-950">
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
          <div className="h-5 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        </div>
        <SkeletonMessages />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-neutral-950">
      <ConversationHeader
        conversation={conversation}
        conversationId={selectedConversationId}
        currentUserId={currentUserId}
        onAssign={onAssign}
        onReassign={onReassign}
        onRelease={onRelease}
      />
      <div className="flex-1 overflow-y-auto p-6">
        {messageEntries.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">
            No hay mensajes aún
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messageEntries.map(([id, msg]) => (
              <MessageBubble key={id} message={msg} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={onSendMessage} disabled={!canSend} />
    </div>
  )
}
