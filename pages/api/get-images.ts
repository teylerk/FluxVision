import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const imagesDir = path.join(process.cwd(), 'public', 'images')
    
    if (!fs.existsSync(imagesDir)) {
      return res.status(200).json({ images: [] })
    }

    const images = fs.readdirSync(imagesDir)
    res.status(200).json({ images })
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}