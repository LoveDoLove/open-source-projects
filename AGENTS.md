# AGENTS.md — Open Source Projects

AI coding agent instructions and project guidelines for `open-source-projects`.

This repository is an edge-native, dual-mode showcase for open source repositories by LoveDoLove. It serves an accessible vanilla HTML/CSS/JS frontend to web browsers, and pre-tokenized, structured Markdown to AI coding agents requesting `Accept: text/markdown`.

Repo language: English. Package manager: pnpm. Deployment platform: Cloudflare Workers with Static Assets.

## Quick reference

- **Dev server:** `pnpm dev` (wraps `wrangler dev` on `http://localhost:8787`).
- **Production deploy:** `pnpm deploy` (runs `wrangler deploy`). Routine deploys are automatic via Cloudflare Workers Git integration on push to `main`.
- **Metadata sync:** `node scripts/fetchRepoMetadata.js` (fetches repository statistics from GitHub REST API).
- **Data flow:** `data/projects.json` (source of truth) -> `scripts/fetchRepoMetadata.js` -> `public/data/projects.json` -> rendered by browser cards or edge Markdown worker.
- **Live URL:** https://open-source-projects.lovedolove.workers.dev
- **Agent Markdown test:** `curl -H "Accept: text/markdown" https://open-source-projects.lovedolove.workers.dev`

## Documentation index

Detailed technical specifications live in the `docs/` directory. Consult them for deep dives:

- [System architecture](docs/architecture.md): Cloudflare Workers runtime, Static Assets binding (`env.ASSETS`), `run_worker_first` routing, content negotiation, and client-side DOM rendering.
- [Metadata pipeline and automation](docs/metadata-pipeline.md): Source schema, GitHub API rate limits, error fallbacks, and the atomic commit-folding CI workflow in `.github/workflows/fetch-repo-metadata.yml`.
- [Deployment and observability](docs/deployment.md): Cloudflare Workers Git integration, Wrangler configuration, and observability metrics.
- [Contributing guide](docs/contributing.md): Adding repositories, local development setup, code formatting, and pull request workflow.
- [Whitepaper (English)](docs/whitepaper.md) / [白皮书 (简体中文)](docs/whitepaper.zh-CN.md): System vision, design philosophy, edge architecture, token economics, and technical roadmap.

## Key invariants and rules

1. **Source of truth:** Change the project list by editing `data/projects.json`. Never hand-edit `public/data/projects.json`. CI regenerates it automatically.
2. **Edge content negotiation:** The configuration `run_worker_first: ["/", "/index.html"]` in `wrangler.jsonc` is load-bearing. Without it, Cloudflare edge serves static assets directly and `src/index.js` never executes for root requests. Do not remove or change it without testing `Accept: text/markdown`.
3. **Dual frontend files:** The repository maintains unminified source files (`public/index.js`, `public/style.css`) and minified files (`public/index.min.js`, `public/style.min.css`) without a build step. If you edit JavaScript or CSS, update both files.
4. **Pnpm workspace configuration:** `pnpm-workspace.yaml` specifies `packages: ['.']`. Cloudflare Workers CI runs pnpm 10.11.1, which fails without this file.
5. **Ignored build dependencies:** `package.json` and `pnpm-workspace.yaml` define `ignoredBuiltDependencies: [esbuild, sharp, workerd]` to keep pnpm builds deterministic across versions.

## Gotchas and lessons

- **PowerShell line encoding:** In PowerShell, `git show REF:file > out` encodes files as UTF-16 LE with a byte-order mark (BOM). Wrangler rejects files with UTF-16 LE BOM. Use `[IO.File]::WriteAllText` or native tools for byte-safe file writes.
- **Wrangler entry point errors:** If Cloudflare CI reports `Missing entry-point`, the Git integration root directory in the Cloudflare dashboard is incorrect. The root must be `/`.
- **Silent metadata fetch fallbacks:** When `scripts/fetchRepoMetadata.js` encounters GitHub API rate limits or network issues, it logs a warning and inserts a fallback entry (stargazers = 0, forks = 0) so the build does not break. Check workflow execution logs to detect API quota exhaustion.
- **Git history rewrites:** Commit history is periodically squashed and force-pushed. Do not rely on persistent commit SHAs across long intervals.

## Known debt

- `public/index.html`: Open Graph and Twitter meta tags contain placeholder URLs (`https://yourdomain.com/`).
- `public/sitemap.xml`, `public/robots.txt`, and `homepage` fields in metadata point to the legacy Pages domain `https://lovedolove.qzz.io`.
- `node-fetch` in `package.json`: Global `fetch` exists natively in Node.js 18+. The fallback import in `scripts/fetchRepoMetadata.js` is unused in modern Node.js environments.
- `public/index.js`: Contains a redundant hostname ternary operator (`hostname === 'localhost' ? ... : ...`).
