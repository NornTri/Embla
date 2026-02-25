---
description: Use Bun as the JS package manager and script runner for the frontend.
globs: "frontend/**/*.ts, frontend/**/*.tsx, frontend/**/*.js, frontend/**/*.jsx, frontend/package.json"
alwaysApply: false
---

Use Bun instead of npm/yarn/pnpm for the frontend (in `frontend/`).

- Use `bun install` instead of `npm install`
- Use `bun run <script>` instead of `npm run <script>`
- Use `bunx <package>` instead of `npx <package>`

The frontend uses Vite as its dev server and bundler. The backend is Django + DRF (Python).
