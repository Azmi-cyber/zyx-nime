import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch all anime
export async function GET() {
  try {
    const anime = await prisma.anime.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        _count: {
          select: { comments: true }
        }
      }
    })
    return NextResponse.json(anime)
  } catch (error) {
    console.error('Error fetching anime:', error)
    return NextResponse.json({ error: 'Failed to fetch anime' }, { status: 500 })
  }
}

// POST - Create new anime (Admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, thumbnail, videoUrl } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const anime = await prisma.anime.create({
      data: {
        title,
        description,
        thumbnail,
        videoUrl
      }
    })

    return NextResponse.json(anime)
  } catch (error) {
    console.error('Error creating anime:', error)
    return NextResponse.json({ error: 'Failed to create anime' }, { status: 500 })
  }
}
