import { Search } from 'lucide-react'
import type { BusinessConversation } from '@/types'
import ConversationItem from './ConversationItem'

interface ConversationListProps {
  conversations: Record<string, BusinessConversation> | null
  loading: boolean
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-neutral-200 dark:bg-neutral-700" />
            <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-700" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ConversationList({
  conversations,
  loading,
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex h-full flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            Conversaciones
          </h2>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              disabled
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm placeholder-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
              placeholder="Buscar..."
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Skeleton />
        </div>
      </div>
    )
  }

  const entries = conversations
    ? Object.entries(conversations).sort(
        ([, a], [, b]) => b.lastMessageAt - a.lastMessageAt
      )
    : []

  return (
    <div className="flex h-full flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
          Conversaciones
        </h2>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm placeholder-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-0 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:placeholder-neutral-500"
            placeholder="Buscar..."
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-sm text-neutral-400">
            Sin conversaciones
          </div>
        ) : (
          entries.map(([id, conv]) => (
            <ConversationItem
              key={id}
              conversation={conv}
              conversationId={id}
              isActive={activeConversationId === id}
              onClick={onSelectConversation}
            />
          ))
        )}
      </div>
    </div>
  )
}
