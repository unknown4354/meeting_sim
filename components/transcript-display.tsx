"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef } from "react"

interface Message {
  id: string
  sender: string
  text: string
  timestamp: string
  isActionItem?: boolean
}

interface TranscriptDisplayProps {
  messages: Message[]
}

export default function TranscriptDisplay({ messages }: TranscriptDisplayProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current
      scrollArea.scrollTop = scrollArea.scrollHeight
    }
  }, [messages]) // Only re-run effect when messages change

  return (
    <ScrollArea className="h-[50vh] rounded-md border p-4" ref={scrollAreaRef}>
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No transcript available yet. Start recording to see the conversation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{message.sender}</span>
                <span className="text-xs text-muted-foreground">{message.timestamp}</span>
              </div>
              <div
                className={`mt-1 p-3 rounded-lg ${
                  message.isActionItem
                    ? "bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <p>{message.text}</p>
                {message.isActionItem && (
                  <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">Action Item</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  )
}

