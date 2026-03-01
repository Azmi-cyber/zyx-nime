import Link from 'next/link'
import Image from 'next/image'
import styles from './page.module.css'

async function getAnime() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/anime`, {
      cache: 'no-store'
    })
    if (!res.ok) {
      return []
    }
    const data = await res.json()
    return data
  } catch (error) {
    console.error('Failed to fetch anime:', error)
    return []
  }
}

export default async function Home() {
  const animeList = await getAnime()

  return (
    <main className={styles.main}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link href="/" className={styles.logo}>
            <Image 
              src="/logo.png" 
              alt="Zyx-Nime" 
              width={40} 
              height={40}
              className={styles.logoImg}
            />
            <span className={styles.logoText}>Zyx</span>
            <span className={styles.logoAccent}>Nime</span>
          </Link>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>Beranda</Link>
            <Link href="/admin" className={styles.navLinkAdmin}>Admin</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <div className={styles.freeBadge}>🎉 FREE 100%</div>
          <h1 className={styles.heroTitle}>
            Selamat Datang di <span className={styles.heroAccent}>Zyx-Nime</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Nonton anime favorit kamu secara gratis. Tanpa iklan, tanpa login untuk penonton.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>{animeList.length}+</span>
              <span className={styles.statLabel}>Seri Anime</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>HD</span>
              <span className={styles.statLabel}>Kualitas</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNumber}>24/7</span>
              <span className={styles.statLabel}>Streaming</span>
            </div>
          </div>
        </div>
        <div className={styles.heroGlow}></div>
      </section>

      {/* Anime Grid Section */}
      <section className={styles.content}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Anime Terbaru</h2>
          <p className={styles.sectionSubtitle}>Koleksi anime pilihan kamu</p>
        </div>
        
        {animeList.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📺</div>
            <h3 className={styles.emptyTitle}>Anime Belum Ditayangkan</h3>
            <p className={styles.emptyText}>
              Tunggu beberapa saat ya! Admin sedang menyiapkan anime untuk kamu.
            </p>
          </div>
        ) : (
          <div className={styles.animeGrid}>
            {animeList.map((anime: any, index: number) => (
              <Link 
                href={`/anime/${anime.id}`} 
                key={anime.id}
                className={styles.animeCard}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.thumbnailWrapper}>
                  <img 
                    src={anime.thumbnail} 
                    alt={anime.title}
                    className={styles.thumbnail}
                  />
                  <div className={styles.playOverlay}>
                    <div className={styles.playButton}>▶</div>
                  </div>
                  <div className={styles.qualityBadge}>HD</div>
                </div>
                <div className={styles.animeInfo}>
                  <h3 className={styles.animeTitle}>{anime.title}</h3>
                  <p className={styles.animeDesc}>{anime.description}</p>
                  <div className={styles.animeMeta}>
                    <span className={styles.animeType}>TV</span>
                    <span className={styles.animeStatus}>Ongoing</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerLogo}>
            <Image 
              src="/logo.png" 
              alt="Zyx-Nime" 
              width={24} 
              height={24}
              style={{ marginRight: '0.5rem' }}
            />
            <span>Zyx-Nime</span>
          </div>
          <p className={styles.footerText}>
            © 2024 Zyx-Nime. Semua hak dilindungi. Streaming anime gratis.
          </p>
        </div>
      </footer>
    </main>
  )
}
