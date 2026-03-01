import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch comments for an anime
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const animeId = searchParams.get('animeId')

    if (!animeId) {
      return NextResponse.json(
        { error: 'Anime ID is required' },
        { status: 400 }
      )
    }

    const comments = await prisma.comment.findMany({
      where: { animeId },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST - Add a new comment
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, content, animeId } = body

    if (!name || !content || !animeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify anime exists
    const anime = await prisma.anime.findUnique({
      where: { id: animeId }
    })

    if (!anime) {
      return NextResponse.json(
        { error: 'Anime not found' },
        { status: 404 }
      )
    }

    const comment = await prisma.comment.create({
      data: {
        name,
        content,
        animeId
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}
