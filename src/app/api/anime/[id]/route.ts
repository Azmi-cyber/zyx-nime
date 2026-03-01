import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch single anime
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const anime = await prisma.anime.findUnique({
      where: { id: params.id },
      include: {
        comments: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 })
    }

    // Parse videoUrl as JSON array
    const videos = anime.videoUrl ? JSON.parse(anime.videoUrl) : []

    return NextResponse.json({
      ...anime,
      videos
    })
  } catch (error) {
    console.error('Error fetching anime:', error)
    return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 })
  }
}

// PUT - Update anime (add video)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { videoUrl, title, description, thumbnail, deleteVideoIndex } = body

    const anime = await prisma.anime.findUnique({
      where: { id: params.id }
    })

    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 })
    }

    // Get existing videos
    let videos: string[] = []
    try {
      videos = anime.videoUrl ? JSON.parse(anime.videoUrl) : []
    } catch {
      videos = []
    }

    // Delete video by index
    if (deleteVideoIndex !== undefined && deleteVideoIndex >= 0 && deleteVideoIndex < videos.length) {
      videos.splice(deleteVideoIndex, 1)
    }
    // Add new video if provided
    else if (videoUrl) {
      videos.push(videoUrl)
    }

    const updatedAnime = await prisma.anime.update({
      where: { id: params.id },
      data: {
        title: title || anime.title,
        description: description || anime.description,
        thumbnail: thumbnail || anime.thumbnail,
        videoUrl: JSON.stringify(videos)
      }
    })

    return NextResponse.json({
      ...updatedAnime,
      videos
    })
  } catch (error) {
    console.error('Error updating anime:', error)
    return NextResponse.json({ error: 'Failed to update anime' }, { status: 500 })
  }
}

// DELETE - Delete anime
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const anime = await prisma.anime.findUnique({
      where: { id: params.id }
    })

    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 })
    }

    await prisma.anime.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Anime deleted successfully' })
  } catch (error) {
    console.error('Error deleting anime:', error)
    return NextResponse.json({ error: 'Failed to delete anime' }, { status: 500 })
  }
}
