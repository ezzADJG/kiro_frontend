import type { Message } from '@/types'

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isInbound = message.direction === 'inbound'

  return (
    <div
      className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}
    >
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
          isInbound
            ? 'rounded-bl-sm bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
            : 'rounded-br-sm bg-blue-600 text-white'
        }`}
      >
        {message.type === 'image' && (
          <p className="text-sm italic opacity-70">🖼 Imagen</p>
        )}
        {message.type === 'audio' && (
          <p className="text-sm italic opacity-70">🎵 Audio</p>
        )}
        {(message.type === 'text' || message.type === 'interactive') && (
          <p className="text-sm">{message.content}</p>
        )}
        <div
          className={`mt-1 flex items-center gap-1 ${
            isInbound ? 'justify-start' : 'justify-end'
          }`}
        >
          <span
            className={`text-[10px] ${
              isInbound
                ? 'text-neutral-400'
                : 'text-blue-200'
            }`}
          >
            {formatTime(message.createdAt)}
          </span>
          {!isInbound && (
            <span className="text-[10px] text-blue-200">
              {message.status === 'sent' ? '✓' : message.status === 'received' ? '✓✓' : message.status === 'read' ? '✓✓' : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
