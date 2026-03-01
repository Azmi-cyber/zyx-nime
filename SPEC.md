# Zyx-Nime - Anime Streaming Platform Specification

## 1. Project Overview

**Project Name:** Zyx-Nime  
**Type:** Fullstack Anime Streaming Website  
**Core Functionality:** A streaming platform for anime with admin content management and public viewing with comments  
**Target Users:** Anime fans (public) and content administrators  

---

## 2. Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Authentication:** NextAuth.js (for admin)
- **File Storage:** Vercel Blob (for video/thumbnail uploads)
- **Styling:** CSS Modules with custom design
- **Deployment:** Vercel

---

## 3. UI/UX Specification

### Color Palette
- **Primary Background:** `#0a0a0f` (deep dark)
- **Secondary Background:** `#12121a` (card background)
- **Accent Primary:** `#ff6b9d` (pink)
- **Accent Secondary:** `#7c3aed` (purple)
- **Accent Gradient:** `linear-gradient(135deg, #ff6b9d, #7c3aed)`
- **Text Primary:** `#ffffff`
- **Text Secondary:** `#a0a0b0`
- **Border:** `#2a2a3a`

### Typography
- **Font Family:** "Outfit" (Google Fonts) for headings, "DM Sans" for body
- **Headings:** Bold, 2-3rem for main titles
- **Body:** Regular, 1rem
- **Anime Title:** 1.25rem, bold

### Layout Structure

#### Homepage (Public)
- **Header:** Logo "Zyx-Nime" with navigation, gradient accent
- **Hero Section:** Featured anime with large banner
- **Anime Grid:** 4 columns desktop, 2 tablet, 1 mobile
- **Anime Card:** Thumbnail, title, description preview, view button
- **Footer:** Simple copyright

#### Anime Detail Page
- **Video Player:** Full-width video embed
- **Info Section:** Title, description
- **Comment Section:** Name input + comment + submit button
- **Related Anime:** Horizontal scroll

#### Admin Login (`/admin`)
- **Login Form:** Username + Password fields
- **Styled with gradient accent**

#### Admin Dashboard (`/admin/dashboard`)
- **Sidebar:** Navigation
- **Anime List:** Table with thumbnail, title, actions
- **Add New Anime Form:**
  - Title (text input)
  - Description (textarea)
  - Thumbnail (file upload)
  - Video (file upload)
  - Submit button

---

## 4. Database Schema (Prisma)

```prisma
model Anime {
  id          String    @id @default(cuid())
  title       String
  description String
  thumbnail   String
  videoUrl    String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  comments    Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  name      String
  content   String
  animeId   String
  anime     Anime    @relation(fields: [animeId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

---

## 5. Functionality Specification

### Admin Features
1. **Login:** Username `admin`, password `200714`
2. **Dashboard:** View all anime list
3. **Add Anime:** Upload thumbnail + video, enter title + description
4. **Delete Anime:** Remove anime from database
5. **Logout:** End admin session

### User Features
1. **Browse Anime:** View all anime on homepage
2. **Watch Video:** Stream anime videos
3. **Read Description:** View anime details
4. **Comment:** Add comments with name (no login required)

### File Uploads
- **Thumbnail:** Image files (jpg, png, webp) - stored in Vercel Blob
- **Video:** Video files (mp4, webm) - stored in Vercel Blob

---

## 6. API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/anime` | Get all anime |
| GET | `/api/anime/[id]` | Get single anime |
| POST | `/api/anime` | Create anime (admin) |
| DELETE | `/api/anime/[id]` | Delete anime (admin) |
| GET | `/api/comments?animeId=` | Get comments for anime |
| POST | `/api/comments` | Add comment |

---

## 7. Deployment Configuration

### Vercel Environment Variables
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
BLOB_READ_WRITE_TOKEN=vercel-blob-token
```

---

## 8. Acceptance Criteria

- [ ] Admin can login at `/admin` with admin/200714
- [ ] Admin can add anime with title, description, thumbnail, video
- [ ] Admin can view and delete anime
- [ ] Public homepage displays all anime in grid
- [ ] Clicking anime shows detail page with video player
- [ ] Users can comment without login (enter name + comment)
- [ ] Beautiful UI with dark theme and gradient accents
- [ ] Deployable to Vercel without errors
