# FluxVision

FluxVision is a Next.js-powered web application that harnesses the Flux API to transform text prompts into AI-generated images, offering real-time status updates and an integrated gallery for viewing and managing your creations.

## Features

- Text-to-Image Generation: Convert your text descriptions into vivid images using advanced AI technology.
- Real-time Status Updates: Track the progress of your image generation with live status updates.
- Image Gallery: View and manage all your previously generated images in a responsive grid layout.
- Automatic Image Saving: All generated images are automatically saved to the server for future reference.
- Error Handling: Robust error handling ensures a smooth user experience, even when issues arise.

## Technology Stack

- Frontend: Next.js, React, TypeScript
- Styling: Tailwind CSS
- API Integration: Axios for HTTP requests
- Image Processing: Server-side image saving with Node.js fs module
- API: Flux API for AI image generation

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up your Flux API key in the `.env.local` file "NEXT_PUBLIC_FLUX_API_KEY=*****"
4. Run the development server with `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Configuration

Ensure you have a `.env.local` file in the root directory with your Flux API key:
