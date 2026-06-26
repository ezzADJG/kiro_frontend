import { Bot, User, UserPlus, ArrowLeftFromLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BusinessConversation } from '@/types'

interface ConversationHeaderProps {
  conversation: BusinessConversation | null
  conversationId: string | null
  currentUserId: string | null
  onAssign: () => void
  onReassign: () => void
  onRelease: () => void
}

export default function ConversationHeader({
  conversation,
  conversationId,
  currentUserId,
  onAssign,
  onReassign,
  onRelease,
}: ConversationHeaderProps) {
  if (!conversationId || !conversation) {
    return (
      <div className="border-b border-neutral-200 p-4 dark:border-neutral-800">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
          Conversación
        </h3>
      </div>
    )
  }

  const isBot = conversation.mode === 'bot'
  const isAssignedToMe = conversation.assignedTo === currentUserId
  const isAssigned = !!conversation.assignedTo

  return (
    <div className="flex items-center justify-between border-b border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
          {conversation.customerName || 'Conversación'}
        </h3>
        {isBot ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            <Bot className="h-3 w-3" />
            Bot activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <User className="h-3 w-3" />
            {conversation.assignedToName || 'Agente'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {isBot && !isAssigned && (
          <Button size="xs" variant="outline" onClick={onAssign}>
            <UserPlus className="h-3 w-3" />
            Tomar
          </Button>
        )}
        {isAssignedToMe && (
          <>
            <Button size="xs" variant="outline" onClick={onReassign}>
              <UserPlus className="h-3 w-3" />
              Delegar
            </Button>
            <Button size="xs" variant="ghost" onClick={onRelease}>
              <ArrowLeftFromLine className="h-3 w-3" />
              Bot
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
