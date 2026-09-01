# AGENTS.md — Open Source Projects

Static showcase of the LoveDoLove GitHub account's 19 repos. Cloudflare
Workers serves `public/` as static assets; a worker adds markdown content
negotiation ("Markdown for Agents"). Plain HTML/JS/CSS, no framework, no
build step. Package manager: pnpm. Repo language: English.

## Quick Reference

- Dev: `pnpm dev` (package.json script wrapping `wrangler dev`).
- Manual deploy: `pnpm deploy` (Wrangler OAuth, account LoveDoLove, Workers
  write scope). Routine deploys are automatic — see Deployment.
- Data flow: `data/projects.json` -> `scripts/fetchRepoMetadata.js` (GitHub
  REST) -> `public/data/projects.json` -> browser cards / worker markdown.
- Live: https://open-source-projects.lovedolove.workers.dev
- Change the project list by editing `data/projects.json`. Never hand-edit
  `public/data/projects.json` — CI regenerates it daily.

## Project Overview

Single page listing the 19 GitHub repos of account LoveDoLove. The frontend
supports four providers (github, gitlab, gitee, bitbucket), but only GitHub
data exists — the other arrays are empty and nothing fetches them.

## Architecture and Data Flow

- Worker `src/index.js`: `Accept: text/markdown` on `/` or `/index.html`
  fetches `/data/projects.json` from `env.ASSETS` and renders markdown —
  one H2 per project: name linked to `html_url`, description,
  stars/forks/updated, topics, homepage. Response headers:
  `content-type: text/markdown; charset=utf-8`, `Vary: Accept`,
  `cache-control: public, max-age=3600`, `x-markdown-tokens: ceil(len/4)`.
  All other requests pass through via `env.ASSETS.fetch(request)`.
- `public/index.html` loads `index.min.js` (deferred) + `style.min.css`;
  the client fetches `/data/projects.json` and renders project cards.
- `scripts/fetchRepoMetadata.js` calls `api.github.com/repos/{user}/{repo}`
  per project. Optional `GITHUB_TOKEN` (Bearer; 5000 req/hr vs 60/hr
  unauthenticated). Uses Node global `fetch`.

## Deployment

- Cloudflare Workers Git integration (dashboard-resident, not in-repo):
  branch `main`, root directory `/`, deploy command `npx wrangler deploy`,
  version command `npx wrangler versions upload`.
- Push to `main` (including CI metadata commits) auto-redeploys.
- GitHub Pages deployment removed (commit 58a9aee, 2026-09-01, after the
  Workers build was verified green). Workers is the only host.

## CI and Automation

Three workflows in `.github/workflows/`:

- `fetch-repo-metadata.yml`: cron `0 0 * * *` + manual dispatch; Node 20,
  `npm install`, runs the fetch script, commits as `github-actions[bot]`
  ("Update public/data/projects.json with latest repo metadata"), pushes
  `--force-with-lease` to `main` (re-triggers the Workers deploy).
- `cleanup-all-runs.yml` / `cleanup-failed-runs.yml`: manual dispatch only,
  `actions: write`; curl and run Python from LoveDoLove/Github-Action-Cleaner
  at runtime — external supply-chain dependency: changes there execute here.
- CI `npx` resolves the latest Wrangler (4.127.1) regardless of the
  lockfile; local uses 4.121.0. Expect version drift.

## Key Files

- `wrangler.jsonc` — Worker config: main `src/index.js`, assets binding
  `ASSETS` serving `./public`, observability on.
- `src/index.js` — markdown-for-agents worker.
- `public/` — the whole static site, served as Workers static assets.
- `data/projects.json` — source of truth for the project list.
- `public/data/projects.json` — generated output; do not hand-edit.
- `scripts/fetchRepoMetadata.js` — metadata updater (root -> public).
- `pnpm-workspace.yaml`, `package.json` — pnpm config (see Decisions).

## Decisions

- Pages -> Workers: hosting unified on one platform that serves both the
  static site and the markdown worker; the Pages workflow was deleted only
  after the Workers build was verified green (58a9aee).
- Worker instead of zone-level Markdown conversion: Cloudflare's zone-level
  "Markdown for Agents" feature requires a Pro plan; the worker implements
  the same Accept-header negotiation manually.
- `run_worker_first: ["/", "/index.html"]` is load-bearing: without it,
  static assets answer `/` before the worker runs and markdown negotiation
  never executes. Verified live — the first deploy returned HTML until this
  was added (fix 0ffe411). Do not remove.
- `pnpm-workspace.yaml` `packages: ['.']`: the Cloudflare build runs pnpm
  10.11.1, which fails ("packages field missing or empty") without it.
- `ignoredBuiltDependencies: [esbuild, sharp, workerd]` (workspace yaml and
  `package.json` pnpm field): pnpm 11 makes ignored build scripts a hard
  error (exit 1) unless explicitly listed; the list makes both pnpm 10 and
  11 exit 0. The undocumented `allowBuilds` yaml key is possibly inert.

## Gotchas and Lessons

- PowerShell: `git show REF:file > out` re-encodes as UTF-16 LE, which
  Wrangler rejects ("UTF-16 LE byte order marker"). Use
  `[IO.File]::WriteAllText` for byte-safe writes, never `>` redirection.
- Wrangler "Missing entry-point" in CI deploys means the Git integration
  root directory is wrong (must be `/`) — a dashboard fix, not a repo fix.
- Metadata fetch failures are silent: each failure logs a warning, writes
  placeholder metadata (repo name, zeros, empty strings), and the output is
  still committed and deployed. Detect failures in the workflow log.
- Commit SHAs are unstable: history is routinely squash-rebased and
  force-pushed (82->1, 17->1; the 2026-09-01 rebase rewrote 530e908/62b05d
  to 94492d2/0ffe411). Do not rely on old SHAs.

## Known Debt (verified stale; fix deliberately, then update this list)

- `public/index.html:16,19,29`: og:url/og:image/twitter:image are
  `yourdomain.com` placeholders; og:image is doubly broken — `images/` sits
  at repo root, not under `public/`.
- `public/sitemap.xml`, `public/robots.txt`, and the homepage field in
  `public/data/projects.json` still point at the old Pages domain
  `https://lovedolove.hidns.co`.
- README Getting Started uses npm (repo is pnpm-locked) and credits
  node-fetch.
- `package.json` version 1.0.4 is stale; versioning is by commit message.
- `node-fetch` dependency: fallback path never executes on Node >= 18 —
  dead weight on Node 18+.
- `public/index.js:9-10`: hostname ternary with identical branches — dead
  code.

## Conventions

- Versioning: squashed commit messages carry the version ("2.2.0",
  "2.1.0"); tags abandoned after v1.1.1 (8 tags: 1.0.0..v1.1.1).
  `package.json` version is not authoritative.
- `index.min.js` / `style.min.css` are manually produced and committed — no
  build script. The unreferenced source copies `index.js` / `style.css` are
  kept in sync by hand; update both when editing.
- `.gitattributes` enforces LF normalization (`* text=auto`).
- pnpm is the package manager; the metadata workflow installs with npm.
