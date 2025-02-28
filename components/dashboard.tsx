"use client"

import { useState } from "react"
import MeetingRoom from "@/components/meeting-room"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
  const [meetingStarted, setMeetingStarted] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      {!meetingStarted ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Meeting Dashboard</CardTitle>
              <CardDescription className="text-center">
                Start a new meeting to begin recording and transcribing
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button size="lg" onClick={() => setMeetingStarted(true)} className="px-8 py-6 text-lg">
                Start Meeting
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <MeetingRoom onEndMeeting={() => setMeetingStarted(false)} />
      )}
    </div>
  )
}

