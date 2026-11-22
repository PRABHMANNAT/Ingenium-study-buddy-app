# Ingenium · Your study companion

A light-themed study chat interface inspired by ChatGPT, with floating side navigation, soft lavender accents, and responsive layouts.

## Run locally

Requires Node.js 22.12+ or 24+ and npm.

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite (normally http://localhost:5173).

```sh
npm run build   # Type-check and build into dist/
npm run preview # Preview the production build
```

## Browser checks

```sh
npx playwright install chromium
npm run test:e2e
```

The tests cover chat and bookmark persistence, history search, file attachments, focus controls, settings, and mobile navigation. Playwright starts the local server when needed.

## Features

- Chat composer with Enter to send and Shift + Enter for a new line.
- Floating, collapsible sidebar and mobile navigation.
- Persistent, searchable conversations (Ctrl / Cmd + K).
- Saved explanations and a notes library.
- Local text / Markdown attachments up to 100 KB.
- Guided, concise, and detailed response preferences.
- A 25-minute focus timer and editable study checklist.
- Personal workspace name, native accessible dialogs, and reduced-motion support.

## Preview behavior and data

This is a **frontend interface preview**, not a live AI service. Responses use built-in examples for photosynthesis, quizzes, study plans, and active recall. Uploaded notes are shown as text excerpts, not AI-generated summaries. No API key is required.

Conversations, preferences, tasks, and notes are stored in this browser’s localStorage. There is no account, remote database, or cross-device sync. The focus timer runs while the page is open and may be throttled by the browser in background tabs. Google Fonts supplies typography, with local sans-serif fallbacks if offline.

To add live AI, introduce a server endpoint, keep provider credentials on the server, and replace the `createReply` call in `src/App.tsx` with a request to that endpoint. Never put secret API keys into client-side Vite environment variables.

## Stack

React, TypeScript, Vite, Lucide icons, and plain CSS.
