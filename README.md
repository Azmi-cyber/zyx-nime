# Zyx-Nime - Anime Streaming Platform

A fullstack anime streaming website built with Next.js, Prisma, and PostgreSQL.

## Features

- 🎬 **Anime Streaming** - Watch anime videos directly on the site
- 👨‍💼 **Admin Dashboard** - Upload and manage anime content
- 💬 **Comments** - Users can comment without login (just enter name)
- 🎨 **Beautiful UI** - Dark theme with gradient accents
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- ☁️ **Vercel Ready** - Easy deployment to Vercel

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (via Prisma ORM)
- **File Storage:** Vercel Blob
- **Styling:** CSS Modules

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd zyx-nime
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database URL:
```
DATABASE_URL="postgresql://username:password@localhost:5432/zyxnime?schema=public"
NEXTAUTH_SECRET="your-secret-key"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Push database schema:
```bash
npx prisma db push
```

6. Run development server:
```bash
npm run dev
```

7. Open http://localhost:3000

## Admin Access

- **URL:** http://localhost:3000/admin
- **Username:** admin
- **Password:** 200714

## Deployment to Vercel

1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - Your PostgreSQL connection string (use Neon, Supabase, or Railway)
   - `BLOB_READ_WRITE_TOKEN` - Your Vercel Blob token
   - `NEXTAUTH_SECRET` - Generate a random secret
4. Deploy!

## Project Structure

```
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/
│   │   ├── admin/          # Admin pages
│   │   ├── anime/          # Anime detail page
│   │   ├── api/            # API routes
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx       # Homepage
│   ├── components/        # React components
│   └── lib/                # Utility functions
├── .env.example           # Environment variables template
├── package.json
└── README.md
```

## License

MIT
