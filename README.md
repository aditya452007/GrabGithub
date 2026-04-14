# Grab GitHub

> Download specific files and folders from any GitHub repository — no cloning required.

**Grab GitHub** is a web application that turns any public GitHub repository into a selectable file explorer. Paste a URL, browse the tree, select exactly what you need, and download it as a ZIP.

## ✨ Features

- 🔗 **Paste any GitHub URL** — full repo, branch, subfolder, or even a single file path
- 🌳 **Browse the file tree** — expandable, searchable, with file-type icons
- ☑️ **Select specific items** — tri-state checkboxes with folder propagation
- 📦 **Download as ZIP** — server-side streaming with progress feedback
- ⚡ **Fast** — uses the GitHub Trees API (one call for the entire tree) + server-side caching
- 🎨 **Beautiful UI** — playful neumorphic design with animations and micro-interactions
- 🔍 **SEO optimised** — full meta tags, Open Graph, Twitter Cards, JSON-LD schema

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Zustand |
| Backend | Express 4 (Node.js) |
| Build | Vite 6 + esbuild |
| Icons | lucide-react |
| ZIP | archiver (server-side streaming) |

## 🚀 Setup

### Prerequisites
- Node.js ≥ 18

### Install & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Highly recommended — increases GitHub API rate limit from 60 to 5,000 requests/hour
# Generate at: https://github.com/settings/tokens (no special scopes needed for public repos)
GITHUB_TOKEN=your_github_personal_access_token
```

Without a `GITHUB_TOKEN`, the app is limited to 60 GitHub API requests per hour. With a token (no scopes needed for public repos), this increases to 5,000.

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
├── server.ts            Express server + GitHub API proxy + ZIP streaming
├── index.html           SPA entry point (SEO meta, fonts, structured data)
├── src/
│   ├── App.tsx          Main application UI
│   ├── store.ts         Zustand state management
│   ├── index.css        Design system (neumorphic tokens, animations)
│   ├── main.tsx         React entry
│   ├── lib/utils.ts     Utility (cn/clsx helper)
│   └── components/
│       ├── TreeBrowser.tsx   File tree with search, icons, accessibility
│       ├── DownloadPanel.tsx  Download bar with size estimation
│       ├── Breadcrumb.tsx     Navigation breadcrumbs
│       ├── Toast.tsx          Toast notification system
│       ├── SkeletonTree.tsx   Loading skeleton
│       └── ErrorBoundary.tsx  Global error handler
└── public/
    ├── robots.txt
    ├── sitemap.xml
    └── llms.txt
```

## 🌐 Deployment

This project requires a **Node.js runtime** (it has an Express backend). It cannot be deployed as a static site.

**Recommended platforms:**
- [Railway](https://railway.app) — easiest, auto-detects Node.js
- [Render](https://render.com) — free tier available
- [Fly.io](https://fly.io) — great for global edge deployment
- [Vercel](https://vercel.com) — with a custom server configuration

## 👤 Author

Made by developer, made for developer.

Created by [Aaditya Thakur](https://github.com/aditya452007)
