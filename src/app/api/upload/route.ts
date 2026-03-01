import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

// Check if Vercel Blob is configured
const blobToken = process.env.BLOB_READ_WRITE_TOKEN

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    // Get filename and type from query params
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    const type = (searchParams.get('type') || 'other') as string

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Get the file buffer from request body
    const arrayBuffer = await request.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    // Determine content type and extension
    let ext = filename.split('.').pop()?.toLowerCase() || ''
    
    // Validate format
    if (type === 'thumbnail') {
      if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
        return NextResponse.json(
          { error: 'Invalid image format. Use jpg, jpeg, png, webp, or gif' },
          { status: 400 }
        )
      }
    } else if (type === 'video') {
      if (!['mp4', 'webm', 'ogg'].includes(ext)) {
        return NextResponse.json(
          { error: 'Invalid video format. Use mp4, webm, or ogg' },
          { status: 400 }
        )
      }
    }

    // Use Vercel Blob if token is available
    if (blobToken) {
      const { put } = await import('@vercel/blob')
      
      // Create unique filename
      const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const blobName = `${type}/${uniqueFilename}`

      // Determine content type
      let contentType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`
      if (type === 'video') {
        contentType = `video/${ext}`
      }

      // Upload to Vercel Blob
      const blob = await put(blobName, buffer, {
        contentType,
        access: 'public'
      })

      return NextResponse.json({
        url: blob.url,
        downloadUrl: blob.downloadUrl
      })
    }

    // Fallback: Use local file storage
    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type)
    const filePath = path.join(uploadDir, uniqueFilename)

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file
    await writeFile(filePath, buffer)

    // Get base URL
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    // Return the URL
    const url = `/uploads/${type}/${uniqueFilename}`
    const fullUrl = `${baseUrl}${url}`
    
    return NextResponse.json({
      url: fullUrl,
      downloadUrl: url
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file: ' + String(error) },
      { status: 500 }
    )
  }
}
