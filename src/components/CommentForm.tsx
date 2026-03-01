'use client'

import { useState } from 'react'
import styles from './CommentForm.module.css'

interface Comment {
  id: string
  name: string
  content: string
  createdAt: string
}

interface CommentFormProps {
  animeId: string
  initialComments: Comment[]
}

export default function CommentForm({ animeId, initialComments }: CommentFormProps) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !content.trim()) return

    setLoading(true)

    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, content, animeId })
      })

      if (res.ok) {
        const newComment = await res.json()
        setComments([newComment, ...comments])
        setName('')
        setContent('')
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Comments ({comments.length})</h2>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            placeholder="Your name"
            required
          />
        </div>
        <div className={styles.formGroup}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.textarea}
            placeholder="Write a comment..."
            rows={3}
            required
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
        {success && <p className={styles.success}>Comment posted successfully!</p>}
      </form>

      {/* Comments List */}
      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
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
  )
}
