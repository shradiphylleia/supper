'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { useCompletion } from 'ai/react'


export default function VoiceCloningApp() {
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [newText, setNewText] = useState('')
  const [consent, setConsent] = useState(false)
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {toast} = useToast()

  const { complete, isLoading } = useCompletion({
    api: '/api/clone-voice',
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) 
      {
        toast({
          title: "File too large",
          description: "Oops, this file is too big! Please upload a file smaller than 5MB.",
          variant: "destructive"
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
      } 
      else if (!file.type.startsWith('audio/')) {
        toast({
          title: "Invalid file type",
          description: "Oops, this file is not supported! Please upload an audio file.",
          variant: "destructive"
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        setVoiceFile(file)
        toast({
          title: "File uploaded",
          description: "Your voice file has been successfully uploaded.",
          variant: "default"
        })
      }
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!voiceFile || !newText || !consent) {
      toast({
        title: "Missing information",
        description: "Please provide a voice file, text, and consent before proceeding.",
        variant: "destructive"
      })
      return
    }

    const formData = new FormData()
    formData.append('voiceFile', voiceFile)
    formData.append('newText', newText)

    try {
      const response = await complete(newText, {
        body: formData,
      })

      if (response) {
        setGeneratedAudioUrl(response)
        toast({
          title: "Success",
          description: "Your new voice file has been generated!",
          variant: "default"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing your request. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-xl">
      <h1 className="text-2xl font-bold mb-6">Voice Cloning App</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="voiceFile">Upload Voice File (max 5MB)</Label>
          <Input 
            id="voiceFile" 
            type="file" 
            onChange={handleFileChange} 
            ref={fileInputRef}
            accept="audio/*"
            aria-describedby="fileHelpText"
          />
          <p id="fileHelpText" className="text-sm text-gray-500 mt-1">
            Upload a small recording of someone's voice (up to 5 MB in size).
          </p>
        </div>
        <div>
          <Label htmlFor="newText">New Text (max 500 characters)</Label>
          <Textarea 
            id="newText" 
            value={newText} 
            onChange={(e) => setNewText(e.target.value)}
            maxLength={500}
            placeholder="Enter the text you want the voice to say"
            aria-describedby="textHelpText"
          />
          <p id="textHelpText" className="text-sm text-gray-500 mt-1">
            {500 - newText.length} characters remaining
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="consent" 
            checked={consent} 
            onCheckedChange={(checked) => setConsent(checked as boolean)}
          />
          <Label htmlFor="consent" className="text-sm text-gray-700">
            I consent to my voice being used for this demo
          </Label>
        </div>
        <Button type="submit" disabled={isLoading || !voiceFile || !newText || !consent}>
          {isLoading ? 'Processing...' : 'Generate New Voice File'}
        </Button>
      </form>
      {generatedAudioUrl && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Generated Audio</h2>
          <audio controls src={generatedAudioUrl} className="w-full">
            Your browser does not support the audio element.
          </audio>
          <Button 
            onClick={() => {
              const link = document.createElement('a')
              link.href = generatedAudioUrl
              link.download = 'generated_voice.mp3'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
            className="mt-2"
          >
            Download
          </Button>
        </div>
      )}
    </div>
  )
}