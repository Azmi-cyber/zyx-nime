import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const type = (searchParams.get('type') || 'other') as string

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Get the file buffer
    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Determine content type and extension
    let contentType = 'application/octet-stream'
    let ext = filename.split('.').pop()?.toLowerCase() || ''
    
    if (type === 'thumbnail') {
      if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      } else {
        return NextResponse.json(
          { error: 'Invalid image format. Use jpg, jpeg, png, webp, or gif' },
          { status: 400 }
        )
      }
    } else if (type === 'video') {
      if (['mp4', 'webm', 'ogg'].includes(ext)) {
        contentType = `video/${ext}`
      } else {
        return NextResponse.json(
          { error: 'Invalid video format. Use mp4, webm, or ogg' },
          { status: 400 }
        )
      }
    }

    // Create unique filename
    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const blobName = `${type}/${uniqueFilename}`

    // Upload to Vercel Blob
    const blob = await put(blobName, buffer, {
      contentType,
      access: 'public'
    })

    return NextResponse.json({
      url: blob.url,
      downloadUrl: blob.downloadUrl
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file: ' + String(error) },
      { status: 500 }
    )
  }
}
