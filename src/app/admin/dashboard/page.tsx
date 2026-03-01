'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import styles from './dashboard.module.css'

// Type definitions
interface Anime {
  id: string
  title: string
  description: string
  thumbnail: string
  videoUrl: string
  createdAt: string
}

function DashboardContent() {
  const router = useRouter()
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showVideoUpload, setShowVideoUpload] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
    videoUrl: ''
  })

  // Check admin session
  useEffect(() => {
    const session = localStorage.getItem('adminSession')
    if (!session) {
      router.push('/admin')
    }
  }, [router])

  // Fetch anime list
  useEffect(() => {
    fetchAnimeList()
  }, [])

  const fetchAnimeList = async () => {
    try {
      const res = await fetch('/api/anime')
      if (res.ok) {
        const data = await res.json()
        setAnimeList(data)
      }
    } catch (error) {
      console.error('Error fetching anime:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminSession')
    router.push('/')
  }

  // Handle initial anime creation (title, description, thumbnail)
  const handleCreateAnime = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      const res = await fetch('/api/anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          thumbnail: formData.thumbnail,
          videoUrl: '' // Empty for now, will upload later
        })
      })

      if (res.ok) {
        setShowModal(false)
        setFormData({ title: '', description: '', thumbnail: '', videoUrl: '' })
        fetchAnimeList()
      } else {
        alert('Failed to create anime')
      }
    } catch (error) {
      console.error('Error creating anime:', error)
      alert('Error creating anime')
    } finally {
      setUploading(false)
    }
  }

  // Handle video upload for existing anime
  const handleVideoUpload = async (animeId: string, file: File) => {
    if (!file) return

    setUploading(true)
    
    try {
      // Step 1: Get upload URL from API
      const res = await fetch(`/api/upload?filename=${file.name}&type=video`, {
        method: 'POST'
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to get upload URL' }))
        throw new Error(errorData.error || 'Failed to get upload URL')
      }
      
      const { url, downloadUrl } = await res.json()
      
      // Step 2: Upload file to Vercel Blob
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })
      
      if (!uploadRes.ok) throw new Error('Failed to upload video')

      // Update anime with video URL
      const updateRes = await fetch(`/api/anime/${animeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoUrl: downloadUrl })
      })

      if (updateRes.ok) {
        setShowVideoUpload(null)
        fetchAnimeList()
        alert('Video uploaded successfully!')
      }
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Error uploading video: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this anime?')) return

    try {
      const res = await fetch(`/api/anime/${id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        fetchAnimeList()
      } else {
        alert('Failed to delete anime')
      }
    } catch (error) {
      console.error('Error deleting anime:', error)
    }
  }

  // Handle file upload for thumbnail
  const handleThumbnailUpload = async (file: File) => {
    if (!file) return

    setUploading(true)
    
    try {
      // Step 1: Get upload URL from API
      const res = await fetch(`/api/upload?filename=${file.name}&type=thumbnail`, {
        method: 'POST'
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to get upload URL' }))
        throw new Error(errorData.error || 'Failed to get upload URL')
      }
      
      const { url, downloadUrl } = await res.json()
      
      // Step 2: Upload file to Vercel Blob
      const uploadRes = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      })
      
      if (!uploadRes.ok) throw new Error('Failed to upload thumbnail')

      setFormData(prev => ({ ...prev, thumbnail: downloadUrl }))
    } catch (error) {
      console.error('Error uploading thumbnail:', error)
      alert('Error uploading thumbnail: ' + (error as Error).message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className={styles.main}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <img 
              src="/logo.png" 
              alt="Zyx-Nime" 
              style={{ width: 32, height: 32, marginRight: '0.5rem' }}
            />
            <span className={styles.logoText}>Zyx</span>
            <span className={styles.logoAccent}>Nime</span>
          </div>
          <span className={styles.adminBadge}>Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          <a href="#" className={styles.navItemActive}>
            <span className={styles.navIcon}>🎬</span>
            Kelola Anime
          </a>
          <button onClick={handleLogout} className={styles.navItem}>
            <span className={styles.navIcon}>🚪</span>
            Logout
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <a href="/" className={styles.viewSite}>
            Lihat Website →
          </a>
        </div>
      </aside>

      <div className={styles.content}>
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>Kelola Anime</h1>
          <button 
            className={styles.addBtn}
            onClick={() => setShowModal(true)}
          >
            + Tambah Kolom Anime
          </button>
        </header>

        <div className={styles.tableContainer}>
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              Loading...
            </div>
          ) : animeList.length === 0 ? (
            <div className={styles.empty}>
              <p>Belum ada anime. Klik "Tambah Kolom Anime" untuk membuat!</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Thumbnail</th>
                  <th>Judul</th>
                  <th>Deskripsi</th>
                  <th>Video</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {animeList.map((anime) => (
                  <tr key={anime.id}>
                    <td>
                      <div className={styles.thumbnailCell}>
                        <img 
                          src={anime.thumbnail || 'https://via.placeholder.com/80x120'} 
                          alt={anime.title}
                        />
                      </div>
                    </td>
                    <td className={styles.titleCell}>{anime.title}</td>
                    <td className={styles.descCell}>
                      {anime.description.substring(0, 40)}...
                    </td>
                    <td>
                      {anime.videoUrl ? (
                        <span className={styles.videoUploaded}>✓ Sudah Upload</span>
                      ) : (
                        <div className={styles.videoUploadSection}>
                          {showVideoUpload === anime.id ? (
                            <div className={styles.uploadForm}>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) handleVideoUpload(anime.id, file)
                                }}
                                disabled={uploading}
                              />
                            </div>
                          ) : (
                            <button 
                              className={styles.uploadVideoBtn}
                              onClick={() => setShowVideoUpload(anime.id)}
                            >
                              🎬 Upload Video
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <a 
                          href={`/anime/${anime.id}`}
                          target="_blank"
                          className={styles.actionBtn}
                        >
                          Lihat
                        </a>
                        <button 
                          className={styles.deleteBtn}
                          onClick={() => handleDelete(anime.id)}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Anime Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Tambah Kolom Anime Baru</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAnime} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Judul Anime *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Contoh: Naruto"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Deskripsi *</label>
                <textarea
                  className={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsi anime..."
                  rows={4}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Thumbnail (Gambar Cover)</label>
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleThumbnailUpload(file)
                  }}
                  disabled={uploading}
                />
                {formData.thumbnail && (
                  <div className={styles.preview}>
                    <img src={formData.thumbnail} alt="Preview" />
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={uploading || !formData.title || !formData.description}
              >
                {uploading ? 'Menyimpan...' : 'Buat Kolom Anime'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}
