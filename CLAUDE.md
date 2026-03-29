# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # Install deps, generate Prisma client, run migrations (first-time)
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run all Vitest tests
npm run db:reset     # Reset database to initial state
```

Run a single test file:

```bash
npx vitest run src/lib/transform/__tests__/jsx-transformer.test.ts
```

Environment variables (`.env`):

- `ANTHROPIC_API_KEY` — optional; falls back to mock provider if absent
- `JWT_SECRET` — defaults to `"development-secret-key"` in dev

## Architecture

**UIGen** is a Next.js 15 app where users describe React components in chat and Claude AI generates them with live preview.

### Core Data Flow

```
Chat input → POST /api/chat (with serialized VFS) → Claude (Vercel AI SDK)
    → tool calls update Virtual File System (client-side, in-memory)
    → PreviewFrame re-renders (Babel transforms JSX → iframe HTML)
    → if authenticated, project saved to SQLite via Prisma
```

### Virtual File System (`src/lib/file-system.ts`)

Central to the app. An in-memory Map-based FS (no disk I/O) that the AI writes files into. It serializes to JSON for database persistence and is sent with every `/api/chat` request so Claude has full context. Two React contexts wrap it:

- `FileSystemContext` — CRUD operations + current file state
- `ChatContext` — wraps Vercel AI SDK's `useChat`, handles incoming tool calls that mutate the VFS

### AI Integration (`src/app/api/chat/route.ts`)

Uses `streamText` from Vercel AI SDK with two tools:

- **`str_replace_editor`** — view/create/str_replace/insert on files
- **`file_manager`** — rename/delete files and folders

System prompt lives in `src/lib/prompts/generation.tsx`. Provider factory at `src/lib/provider.ts` returns the real Anthropic client or a `MockLanguageModel` (for demos without an API key) that returns static component templates.

### Preview Engine (`src/lib/transform/jsx-transformer.ts` + `src/components/preview/PreviewFrame.tsx`)

Runs Babel Standalone in the browser to transform JSX/TSX at runtime. Builds an ES module import map from the virtual FS, injects React/ReactDOM/Tailwind via CDN, and renders in an isolated iframe. Auto-detects entry points (`App.jsx`, `index.jsx`, etc.).

### Auth

JWT sessions (7-day expiry) stored in httpOnly cookies. Server actions in `src/actions/` handle sign-up/in/out. Middleware at `src/middleware.ts` protects `/api/projects` and `/api/filesystem` routes. Anonymous users can use the app; projects are saved to DB only when authenticated.

### Database (Prisma + SQLite)

Schema is defined in `prisma/schema.prisma` — reference it whenever you need to understand the structure of data stored in the database. Models: `User` (email, hashedPassword) → `Project` (name, messages JSON, data JSON for serialized VFS). Use `src/lib/prisma.ts` singleton for all queries.

### UI Layout (`src/app/main-content.tsx`)

React Resizable Panels split: **35% chat** (left) | **65% preview+code tabs** (right). Preview tab = iframe. Code tab = file tree + Monaco Editor.

### Developement Best practices

- Use comments sparingly. Only comment complex code.
