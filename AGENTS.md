<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

## Next.js rules

- Always treat the installed Next.js version and bundled docs in `node_modules/next/dist/docs/` as the source of truth.
- Before touching routing, rendering, data fetching, caching, streaming, server/client boundaries, middleware, or config, read the relevant bundled documentation.
- Check the installed version before assuming any API, convention, directive, or caching behavior is valid.
- Prefer the current documented pattern; do not use deprecated or legacy APIs unless required by existing code.
- Do not add caching without a clear purpose, scope, invalidation strategy, and confirmation that it is safe for user-specific data.

<!-- END:nextjs-agent-rules -->
