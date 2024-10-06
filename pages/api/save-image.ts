import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { url } = req.body
    
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data, 'binary')
      
      const imagesDir = path.join(process.cwd(), 'public', 'images')
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true })
      }

      const filename = `image_${Date.now()}.png`
      const filepath = path.join(imagesDir, filename)
      
      fs.writeFileSync(filepath, buffer)
      
      res.status(200).json({ success: true, filename })
    } catch (error) {
      console.error('Error saving image:', error)
      res.status(500).json({ success: false, error: 'Failed to save image' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}