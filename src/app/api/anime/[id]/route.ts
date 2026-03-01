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

    return NextResponse.json(anime)
  } catch (error) {
    console.error('Error fetching anime:', error)
    return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 })
  }
}

// PUT - Update anime (add video URL)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { videoUrl } = body

    const anime = await prisma.anime.findUnique({
      where: { id: params.id }
    })

    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 })
    }

    const updatedAnime = await prisma.anime.update({
      where: { id: params.id },
      data: {
        videoUrl: videoUrl || anime.videoUrl
      }
    })

    return NextResponse.json(updatedAnime)
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
