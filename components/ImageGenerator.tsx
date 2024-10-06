'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Label } from '@/components/label'
import axios, { AxiosError } from 'axios'

const MAX_RETRIES = 10;
const RETRY_DELAY = 5000;

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('')
  const [taskId, setTaskId] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [savedImages, setSavedImages] = useState<string[]>([])

  const headers = {
    'x-key': process.env.NEXT_PUBLIC_FLUX_API_KEY,
    'Content-Type': 'application/json'
  }

  const generateImage = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setImageUrl(null)
    setStatus('Initiating image generation...')

    try {
      const response = await axios.post('https://api.bfl.ml/v1/flux-pro-1.1', {
        prompt: prompt,
        width: 1024,
        height: 768,
        prompt_upsampling: false,
        seed: Math.floor(Math.random() * 1000000),
        safety_tolerance: 2
      }, { headers })

      console.log('Generation response:', response.data)

      if (response.data && response.data.id) {
        setTaskId(response.data.id)
        setStatus(`Task created with ID: ${response.data.id}`)
      } else {
        throw new Error('No task ID in the response')
      }
    } catch (error) {
      handleError(error)
    } finally {
      setLoading(false)
    }
  }

  const checkTaskStatus = useCallback(async (id: string) => {
    try {
      const response = await axios.get(`https://api.bfl.ml/v1/get_result?id=${id}`, { headers })
      console.log('Task status response:', response.data)
      setRetryCount(0);

      if (response.data && response.data.status === 'Ready') {
        if (response.data.result) {
          const imageUrl = response.data.result.sample;
          if (imageUrl) {
            setImageUrl(imageUrl)
            setTaskId(null)
            setStatus('Image generation completed!')
            await saveImage(imageUrl)  // Save the image
            return false
          } else {
            console.error('Response data:', response.data)
            throw new Error('Image URL not found in the response')
          }
        } else {
          throw new Error('Result object not found in the response')
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        if (retryCount < MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          setStatus(`Task not found (Attempt ${retryCount + 1}/${MAX_RETRIES}), retrying in 5 seconds...`)
          return true
        } else {
          throw new Error(`Task not found after ${MAX_RETRIES} attempts`)
        }
      } else {
        handleError(error)
        return false
      }
    }
  }, [retryCount, headers])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    if (taskId) {
      timeoutId = setTimeout(async () => {
        const shouldContinue = await checkTaskStatus(taskId);
        if (!shouldContinue) {
          setTaskId(null);
        }
      }, RETRY_DELAY);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [taskId, checkTaskStatus, retryCount]);

  const handleError = (error: unknown) => {
    console.error('Error:', error)
    let errorMessage = 'An unknown error occurred'
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError
      if (axiosError.response) {
        errorMessage = `Server error: ${axiosError.response.status} - ${JSON.stringify(axiosError.response.data)}`
      } else if (axiosError.request) {
        errorMessage = 'No response received from the server. Please check your internet connection.'
      } else {
        errorMessage = `Error setting up the request: ${axiosError.message}`
      }
    } else if (error instanceof Error) {
      errorMessage = error.message
    }
    setError(errorMessage)
    setStatus(null)
    setTaskId(null)
  }

  const saveImage = async (url: string) => {
    try {
      const response = await axios.post('/api/save-image', { url })
      if (response.data.success) {
        setSavedImages(prev => [...prev, response.data.filename])
      } else {
        throw new Error('Failed to save image')
      }
    } catch (error) {
      console.error('Error saving image:', error)
      setError('Failed to save image')
    }
  }

  useEffect(() => {
    const fetchSavedImages = async () => {
      try {
        const response = await axios.get('/api/get-images')
        setSavedImages(response.data.images)
      } catch (error) {
        console.error('Error fetching saved images:', error)
      }
    }

    fetchSavedImages()
  }, [])

  return (
    <div className="w-full max-w-4xl">
      <form onSubmit={generateImage} className="space-y-4">
        <div>
          <Label htmlFor="prompt">Image Prompt</Label>
          <Input
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your image prompt"
            required
          />
        </div>
        <Button type="submit" disabled={loading || !!taskId}>
          {loading ? 'Generating...' : taskId ? 'Processing...' : 'Generate Image'}
        </Button>
      </form>
      {status && <p className="mt-4">{status}</p>}
      {taskId && <p className="mt-4">Task ID: {taskId}</p>}
      {imageUrl && (
        <div className="mt-8">
          <img src={imageUrl} alt="Generated image" className="w-full rounded-lg shadow-lg" />
        </div>
      )}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      <div className="mt-8 grid grid-cols-3 gap-4">
        {savedImages.map((image, index) => (
          <img 
            key={index} 
            src={`/images/${image}`} 
            alt={`Generated image ${index + 1}`} 
            className="w-full h-auto rounded-lg shadow-lg"
          />
        ))}
      </div>
    </div>
  )
}