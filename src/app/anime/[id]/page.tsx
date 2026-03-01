'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import styles from './anime.module.css'

interface Comment {
  id: string
  name: string
  content: string
  createdAt: Date
}

interface Anime {
  id: string
  title: string
  description: string
  thumbnail: string | null
  videoUrl: string | null
  videos: string[]
  comments: Comment[]
}

export default function AnimePage({ params }: { params: { id: string } }) {
  const [anime, setAnime] = useState<Anime | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  useEffect(() => {
    fetchAnime()
  }, [params.id])

  const fetchAnime = async () => {
    try {
      const res = await fetch(`/api/anime/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setAnime(data)
      }
    } catch (error) {
      console.error('Error fetching anime:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, content, animeId: params.id })
      })

      if (res.ok) {
        setName('')
        setContent('')
        fetchAnime() // Refresh comments
      } else {
        alert('Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.main}>Loading...</div>
      </main>
    )
  }

  if (!anime) {
    return (
      <main className={styles.main}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            <Image 
              src="/logo.png" 
              alt="Zyx-Nime" 
              width={32} 
              height={32}
            />
            <span className={styles.logoText}>Zyx</span>
            <span className={styles.logoAccent}>Nime</span>
          </Link>
          <Link href="/admin" className={styles.adminLink}>
            Admin
          </Link>
        </header>
        <div className={styles.main}>
          <h1>Anime tidak ditemukan</h1>
          <Link href="/">Kembali ke Beranda</Link>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          <Image 
            src="/logo.png" 
            alt="Zyx-Nime" 
            width={32} 
            height={32}
          />
          <span className={styles.logoText}>Zyx</span>
          <span className={styles.logoAccent}>Nime</span>
        </Link>
        <Link href="/admin" className={styles.adminLink}>
          Admin
        </Link>
      </header>

      {/* Video Player */}
      <section className={styles.videoSection}>
        <div className={styles.videoContainer}>
          {anime.videos && anime.videos.length > 0 ? (
            <>
              <video 
                key={currentVideoIndex}
                className={styles.videoPlayer}
                controls
                autoPlay
                playsInline
                src={anime.videos[currentVideoIndex]}
                poster={anime.thumbnail || undefined}
              >
                Your browser does not support the video tag.
              </video>
              {anime.videos.length > 1 && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {anime.videos.map((video, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        console.log('Switching to video:', video)
                        setCurrentVideoIndex(index)
                      }}
                      style={{
                        padding: '5px 10px',
                        background: currentVideoIndex === index ? '#e63946' : '#333',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Episode {index + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              Video belum tersedia
            </div>
          )}
        </div>
      </section>

      {/* Anime Info */}
      <section className={styles.infoSection}>
        <div className={styles.infoContent}>
          <h1 className={styles.animeTitle}>{anime.title}</h1>
          <div className={styles.animeMeta}>
            <span className={styles.badge}>TV</span>
            <span className={styles.badge}>HD</span>
            <span className={styles.badge}>Sub</span>
          </div>
          <p className={styles.animeDescription}>{anime.description}</p>
        </div>
      </section>

      {/* Comments Section */}
      <section className={styles.commentsSection}>
        <div className={styles.commentsContent}>
          <h2 className={styles.commentsTitle}>
            Comments ({anime.comments.length})
          </h2>

          {/* Comment Form */}
          <form className={styles.commentForm} onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <input
                type="text"
                name="name"
                className={styles.nameInput}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className={styles.formRow}>
              <textarea
                name="content"
                className={styles.commentInput}
                placeholder="Write a comment..."
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>

          {/* Comments List */}
          <div className={styles.commentsList}>
            {anime.comments.length === 0 ? (
              <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
            ) : (
              anime.comments.map((comment) => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentName}>{comment.name}</span>
                    <span className={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className={styles.commentContent}>{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2024 Zyx-Nime. All rights reserved.</p>
      </footer>
    </main>
  )
}
