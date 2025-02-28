"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mic, MicOff, X, Volume2, VolumeX } from "lucide-react"
import TranscriptDisplay from "@/components/transcript-display"
import ActionItems from "@/components/action-items"
import AudioPlayer from "@/components/audio-player"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface MeetingRoomProps {
  onEndMeeting: () => void
}

interface Message {
  id: string
  sender: string
  text: string
  timestamp: string
  isActionItem?: boolean
}

export default function MeetingRoom({ onEndMeeting }: MeetingRoomProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState<Message[]>([])
  const [actionItems, setActionItems] = useState<Message[]>([])
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("Disconnected")
  const [summary, setSummary] = useState<string | null>(null)
  const [aiAudioUrl, setAiAudioUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPlayingAiAudio, setIsPlayingAiAudio] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)

  const websocketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const aiAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      setConnectionStatus("Connecting...")

      try {
        // Connect to the FastAPI WebSocket endpoint
        const ws = new WebSocket("ws://localhost:8000/ws")

        ws.onopen = () => {
          setIsConnected(true)
          setConnectionStatus("Connected")
          setError(null)
        }

        ws.onmessage = (event) => {
          const message = event.data

          if (message.startsWith("Audio file saved:")) {
            // Handle the audio file path
            const audioFilePath = message.replace("Audio file saved: ", "").trim()
            setAiAudioUrl(`http://localhost:8000/${audioFilePath}`)
          } else {
            // Handle the summary text
            setSummary(message)

            // Extract action items from the summary
            const actionItemsRegex = /Action Items:([\s\S]*?)(?:\n\n|$)/
            const match = message.match(actionItemsRegex)

            if (match && match[1]) {
              const actionItemsList = match[1]
                .split("\n- ")
                .filter((item) => item.trim().length > 0)
                .map((item) => item.trim())

              const newActionItems = actionItemsList.map((item) => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                sender: "AI Assistant",
                text: item.replace(/^- /, ""),
                timestamp: new Date().toLocaleTimeString(),
                isActionItem: true,
              }))

              setActionItems((prev) => [...prev, ...newActionItems])
            }

            // Add the summary to the transcript
            const newMessage: Message = {
              id: Date.now().toString(),
              sender: "AI Assistant",
              text: message,
              timestamp: new Date().toLocaleTimeString(),
            }

            setTranscript((prev) => [...prev, newMessage])
          }
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          setConnectionStatus("Error")
          setError("Failed to connect to the server. Please try again.")
        }

        ws.onclose = () => {
          setIsConnected(false)
          setConnectionStatus("Disconnected")
        }

        websocketRef.current = ws
      } catch (error) {
        console.error("WebSocket connection error:", error)
        setConnectionStatus("Error")
        setError("Failed to connect to the server. Please try again.")
      }
    }

    connectWebSocket()

    // Cleanup function
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }
    }
  }, [])

  // Handle recording start/stop
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
    } else {
      if (!isConnected) {
        setError("Not connected to the server. Please wait for the connection to be established.")
        return
      }

      try {
        // Start recording
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
          const audioUrl = URL.createObjectURL(audioBlob)
          setAudioUrl(audioUrl)

          // Send the audio data to the server via WebSocket
          if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            try {
              // Convert Blob to ArrayBuffer
              const arrayBuffer = await audioBlob.arrayBuffer()
              websocketRef.current.send(arrayBuffer)

              // Add user message to transcript
              const newMessage: Message = {
                id: Date.now().toString(),
                sender: "You",
                text: "Audio recording sent for processing...",
                timestamp: new Date().toLocaleTimeString(),
              }

              setTranscript((prev) => [...prev, newMessage])
            } catch (error) {
              console.error("Error sending audio data:", error)
              setError("Failed to send audio data to the server.")
            }
          } else {
            setError("WebSocket connection is not open. Please try reconnecting.")
          }

          // Stop all audio tracks
          stream.getAudioTracks().forEach((track) => track.stop())
        }

        mediaRecorder.start(1000) // Collect data every second
        setIsRecording(true)
        setError(null)
      } catch (error) {
        console.error("Error accessing microphone:", error)
        setError("Failed to access microphone. Please check your permissions.")
      }
    }
  }

  // Simulate a meeting for testing
  const simulateMeeting = async () => {
    setIsSimulating(true)
    setError(null)
    try {
      const response = await fetch("http://localhost:8000/simulate_meeting")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      // Add the simulated dialogue to the transcript
      const dialogueLines = data.dialogue.trim().split("\n")

      const newMessages = dialogueLines
        .map((line) => {
          if (line.trim()) {
            const [sender, ...textParts] = line.split(":")
            const text = textParts.join(":").trim()

            return {
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              sender: sender.trim(),
              text,
              timestamp: new Date().toLocaleTimeString(),
            }
          }
          return null
        })
        .filter(Boolean) as Message[]

      setTranscript((prev) => [...prev, ...newMessages])

      // Set the AI audio URL
      setAiAudioUrl(`http://localhost:8000/${data.audio_file}`)
    } catch (error) {
      console.error("Error simulating meeting:", error)
      setError("Failed to simulate meeting. Please check if the server is running and accessible.")
    } finally {
      setIsSimulating(false)
    }
  }

  // Play/pause AI audio
  const toggleAiAudio = () => {
    if (aiAudioRef.current) {
      if (isPlayingAiAudio) {
        aiAudioRef.current.pause()
      } else {
        aiAudioRef.current.play()
      }
      setIsPlayingAiAudio(!isPlayingAiAudio)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Meeting Room</CardTitle>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-sm text-muted-foreground">{connectionStatus}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                <Button onClick={toggleRecording} variant={isRecording ? "destructive" : "default"}>
                  {isRecording ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Button>

                {audioUrl && <AudioPlayer audioUrl={audioUrl} />}

                <Button variant="outline" onClick={simulateMeeting} disabled={isSimulating}>
                  {isSimulating ? (
                    <>
                      <span className="mr-2">Simulating...</span>
                      <span className="animate-spin">⏳</span>
                    </>
                  ) : (
                    "Simulate Meeting"
                  )}
                </Button>
              </div>

              <Button variant="outline" onClick={onEndMeeting}>
                <X className="mr-2 h-4 w-4" />
                End Meeting
              </Button>
            </div>

            {aiAudioUrl && (
              <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-md">
                <audio
                  ref={aiAudioRef}
                  src={aiAudioUrl}
                  onEnded={() => setIsPlayingAiAudio(false)}
                  className="hidden"
                />
                <Button size="icon" variant="outline" onClick={toggleAiAudio} className="h-9 w-9">
                  {isPlayingAiAudio ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <span className="text-sm">{isPlayingAiAudio ? "Stop AI Audio" : "Play AI Audio Summary"}</span>
              </div>
            )}

            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="action-items">Action Items ({actionItems.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="transcript">
                <TranscriptDisplay messages={transcript} />
              </TabsContent>
              <TabsContent value="action-items">
                <ActionItems items={actionItems} />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meeting Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {summary ? (
              <div className="prose prose-sm dark:prose-invert">
                <div
                  dangerouslySetInnerHTML={{
                    __html: summary
                      .replace(/\n/g, "<br />")
                      .replace(/Action Items:/g, "<strong>Action Items:</strong>"),
                  }}
                />
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground">Record or simulate a meeting to generate an AI summary</p>
              </div>
            )}

            <div>
              <h3 className="font-medium mb-2">Participants</h3>
              <div className="flex flex-wrap gap-2">
                {transcript.length > 0 ? (
                  Array.from(new Set(transcript.map((m) => m.sender))).map((name) => (
                    <div key={name} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-sm">
                      {name}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No participants yet</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

