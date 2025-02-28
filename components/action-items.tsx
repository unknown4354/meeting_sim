import { ScrollArea } from "@/components/ui/scroll-area"
import { CheckCircle2 } from "lucide-react"
import { useState } from "react"

interface ActionItem {
  id: string
  sender: string
  text: string
  timestamp: string
}

interface ActionItemsProps {
  items: ActionItem[]
}

export default function ActionItems({ items }: ActionItemsProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set())

  const toggleComplete = (id: string) => {
    setCompletedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  return (
    <ScrollArea className="h-[50vh] rounded-md border p-4">
      {items.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No action items identified yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950 ${
                completedItems.has(item.id) ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() => toggleComplete(item.id)}
                  className="mt-1 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300"
                >
                  <CheckCircle2
                    className={`h-5 w-5 ${completedItems.has(item.id) ? "fill-amber-600 dark:fill-amber-400" : ""}`}
                  />
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.sender}</span>
                    <span className="text-xs text-muted-foreground">{item.timestamp}</span>
                  </div>
                  <p className={completedItems.has(item.id) ? "line-through" : ""}>{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </ScrollArea>
  )
}

