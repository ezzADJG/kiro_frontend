import type { BusinessConversation } from '@/types'

function formatTime(timestamp: number) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) {
    return date.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  if (diffDays === 1) return 'Ayer'
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
  })
}

function getPreviewText(text: string): string {
  if (!text || text === '‎') return 'Sin mensajes'
  if (text.startsWith('[image]')) return '🖼 Imagen'
  if (text.startsWith('[audio]')) return '🎵 Audio'
  if (text.startsWith('[document]')) return '📄 Documento'
  return text
}

interface ConversationItemProps {
  conversation: BusinessConversation
  conversationId: string
  isActive: boolean
  onClick: (id: string) => void
}

export default function ConversationItem({
  conversation,
  conversationId,
  isActive,
  onClick,
}: ConversationItemProps) {
  return (
    <button
      onClick={() => onClick(conversationId)}
      className={`flex w-full items-start gap-3 border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 ${
        isActive
          ? 'bg-neutral-100 dark:bg-neutral-800'
          : 'bg-white dark:bg-neutral-950'
      }`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
        {conversation.customerName?.charAt(0) || '?'}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-neutral-900 dark:text-white">
            {conversation.customerName?.trim() || conversation.customerPhone}
          </span>
          <span className="shrink-0 text-xs text-neutral-400">
            {formatTime(conversation.lastMessageAt)}
          </span>
        </div>
        <p className="truncate text-sm text-neutral-500">
          {getPreviewText(conversation.lastMessageText)}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <div className="flex shrink-0 items-center">
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-medium text-white">
            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
          </span>
        </div>
      )}
    </button>
  )
}
