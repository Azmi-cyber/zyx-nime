'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './admin.module.css'

// Admin credentials - can be set via environment variables
// For demo: username=admin, password=200714
const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin'
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '200714'

export default function AdminLogin() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

  

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Store admin session in localStorage (simple auth for demo)
      localStorage.setItem('adminSession', 'true')
      router.push('/admin/dashboard')
    } else {
      setError('Invalid username or password')
      setLoading(false)
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div className={styles.logo}>
              <img 
                src="/logo.png" 
                alt="Zyx-Nime" 
                style={{ width: 40, height: 40, marginRight: '0.5rem' }}
              />
              <span className={styles.logoText}>Zyx</span>
              <span className={styles.logoAccent}>Nime</span>
            </div>
            <h1 className={styles.title}>Admin Login</h1>
            <p className={styles.subtitle}>Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                {error}
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                placeholder="Enter username"
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Enter password"
                required
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.spinner}></span>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className={styles.hint}>
            <p>Admin access required</p>
          </div>

          <a href="/" className={styles.backLink}>
            ← Back to Home
          </a>
        </div>

        <div className={styles.decoration}>
          <div className={styles.circle1}></div>
          <div className={styles.circle2}></div>
          <div className={styles.circle3}></div>
        </div>
      </div>
    </main>
  )
}
