# Architecture and design whitepaper: Open Source Projects Showcase

*A dual-mode edge showcase platform engineered for humans and AI coding agents.*

- **Repository:** [LoveDoLove/open-source-projects](https://github.com/LoveDoLove/open-source-projects)
- **Live deployment:** [open-source-projects.lovedolove.workers.dev](https://open-source-projects.lovedolove.workers.dev)
- **Version:** 2.2.0
- **Language edition:** English | [简体中文](whitepaper.zh-CN.md)

---

## 1. Executive summary and vision

Modern software engineering increasingly involves collaboration between human developers and autonomous AI coding agents. While human developers consume information through interactive, visual user interfaces, AI agents (such as Claude Code, Cursor, and DeepSeek Harness) consume structured, concise text to minimize context window consumption.

Conventional project portals and showcase directories fail to address this dual audience:
- Standard websites return bloated HTML documents laden with styling, script tags, tracking scripts, and navigation chrome. When an AI agent fetches a standard showcase page, it consumes between 5,000 and 25,000 tokens of context window merely to parse a handful of repository names and descriptions.
- Dedicated REST APIs require specialized documentation, client libraries, authentication keys, and multiple round-trips to discover available endpoints.

Open Source Projects Showcase (OSPS) eliminates this compromise through an edge-native, dual-mode delivery architecture. By deploying directly on Cloudflare Workers with Static Assets and implementing HTTP content negotiation, OSPS serves a single uniform URL to both humans and machines:
- **Browsers** receive a lightweight, responsive web application built with vanilla web standards and sub-millisecond edge asset delivery.
- **AI agents** sending `Accept: text/markdown` receive clean, pre-tokenized Markdown that costs under 600 tokens for the entire catalog, complete with an `x-markdown-tokens` estimation header.

The vision of OSPS is to establish a zero-maintenance, edge-native standard for personal and organizational open source portfolios in the agentic era.

---

## 2. Design philosophy

OSPS adheres to four foundational design principles.

### 2.1 The dual-representation principle
A digital portfolio in the agentic era must satisfy both visual aesthetics for human evaluators and semantic efficiency for automated tooling. Rather than maintaining disparate URLs or dedicated API subdomains, the canonical root URL (`/`) dynamically adapts its representation based on standard HTTP headers.

### 2.2 Zero-build, zero-framework runtime
Modern web stacks suffer from framework bloat and fragile build pipelines. OSPS runs in the browser using standard HTML5, CSS custom properties, and native ES6+ JavaScript. No node build step, transpilations, or bundlers are required to generate the frontend assets. The edge logic is a single JavaScript worker file executed directly by the Cloudflare Workers V8 runtime.

### 2.3 Strict separation of configuration and metadata
The system decouples human intent from computed state:
- `data/projects.json` is the sole source of truth for repository selection. Contributors curate the project list with declarative repository slugs.
- `public/data/projects.json` is a generated artifact containing live stars, forks, topics, descriptions, and update timestamps.
Human contributors never edit metadata by hand, and automated pipelines never alter configuration parameters.

### 2.4 Idempotent and clean git history
Automated bots updating metadata daily can quickly pollute a repository's commit graph with thousands of trivial entries. OSPS implements an atomic commit-folding strategy that replaces prior automated runs while safely replaying when concurrent human commits occur.

---

## 3. Overall architecture

The system operates across three decoupled layers: the developer interface layer, the edge runtime layer, and the continuous data pipeline layer.

```
+-----------------------------------------------------------------------------------+
|                           DEVELOPER / CLIENT LAYER                                |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|      +-------------------------+                 +-------------------------+      |
|      |      Human Browser      |                 |    AI Coding Agent      |      |
|      |    (Accept: text/html)  |                 | (Accept: text/markdown) |      |
|      +------------+------------+                 +------------+------------+      |
+-------------------|-------------------------------------------|-------------------+
                    |                                           |
                    |           HTTP GET /                      |
                    +--------------------+----------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         CLOUDFLARE EDGE RUNTIME LAYER                             |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|                          +---------------------------+                            |
|                          |    src/index.js (Worker)  |                            |
|                          | run_worker_first: ["/"]   |                            |
|                          +-------------+-------------+                            |
|                                        |                                          |
|                  +---------------------+---------------------+                    |
|                  |                                           |                    |
|       [Accept: text/markdown]                       [Other Accept]                |
|                  |                                           |                    |
|                  v                                           v                    |
|   +-----------------------------+             +-----------------------------+     |
|   | 1. Read env.ASSETS          |             | Pass through directly to    |     |
|   |    /data/projects.json      |             | env.ASSETS.fetch(request)   |     |
|   | 2. renderMarkdown()         |             +--------------+--------------+     |
|   | 3. Set Vary, Token headers  |                            |                    |
|   +--------------+--------------+                            v                    |
|                  |                            +-----------------------------+     |
|                  v                            | Serve public/index.html     |     |
|   Return Markdown document                    | Client fetches JSON & cards |     |
|   (~600 tokens)                               +-----------------------------+     |
|                                                                                   |
+-----------------------------------------------------------------------------------+
                                         ^
                                         | Deploys static assets & worker
                                         | on push to main
+-----------------------------------------------------------------------------------+
|                     CONTINUOUS DATA AUTOMATION LAYER (CI/CD)                      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  +--------------------+         +--------------------+     +-------------------+  |
|  | data/projects.json | ------> | scripts/           | --> | public/data/      |  |
|  | (Source of Truth)  |         | fetchRepoMetadata  |     | projects.json     |  |
|  +--------------------+         +---------+----------+     +---------+---------+  |
|                                           |                          |            |
|                                           v                          v            |
|                                  GitHub REST API v3        Atomic Commit-Folding  |
|                                                            & Lease-Safe Git Push  |
+-----------------------------------------------------------------------------------+
```

---

## 4. Core concepts and specifications

### 4.1 Markdown-for-agents specification
Cloudflare provides a zone-level "Markdown for Agents" feature exclusively on enterprise and paid Pro plans. OSPS implements an open, vendor-portable version of this pattern within worker code.

#### Request handling rules
1. Extract request pathname and the incoming `Accept` header.
2. If `pathname` matches `/` or `/index.html` AND the `Accept` header contains `text/markdown`:
   - Fetch the asset `/data/projects.json` via `env.ASSETS.fetch()`.
   - Parse the JSON array and map through active project records.
   - Generate structured Markdown with standard headings, hyperlinked project titles, descriptions, metrics (stars, forks, updated dates), and topic badges.
   - Return an HTTP 200 response with:
     - `content-type: text/markdown; charset=utf-8`
     - `vary: Accept`
     - `cache-control: public, max-age=3600`
     - `x-markdown-tokens: <count>`
3. If criteria are not met, execute `env.ASSETS.fetch(request)` to pass execution to the static file server.

#### Token estimation formula
The worker computes the token estimation header using standard subword estimation:
```javascript
const tokenCount = Math.ceil(markdownString.length / 4);
```
This metric enables upstream LLM systems to evaluate payload budget before reading full response bodies.

### 4.2 Data schema contracts

#### Source configuration: `data/projects.json`
```json
[
  {
    "github": [
      {
        "username": "LoveDoLove",
        "projects": [
          "Veyra",
          "dsh-codebase-memory-mcp",
          "open-source-projects"
        ]
      }
    ],
    "gitlab": [],
    "gitee": [],
    "bitbucket": []
  }
]
```

#### Hydrated output: `public/data/projects.json`
Each project record is enriched with exact properties:
- `repo` (string): repository slug.
- `name` (string): display title.
- `description` (string): repository summary.
- `html_url` (string): canonical GitHub repository URL.
- `homepage` (string): external project homepage or documentation site.
- `stargazers_count` (number): star count.
- `forks_count` (number): fork count.
- `topics` (string[]): topic tags.
- `updated_at` (string): ISO-8601 timestamp of last activity.

---

## 5. Technical design and implementation

### 5.1 Cloudflare Workers asset routing mechanics
In Cloudflare Workers with Static Assets, requests are resolved by default against files in the asset directory before invoking worker code. If `public/index.html` exists, a request for `/` would bypass `src/index.js` entirely.

OSPS overrides this behavior in `wrangler.jsonc`:
```jsonc
"assets": {
  "directory": "./public",
  "binding": "ASSETS",
  "run_worker_first": ["/", "/index.html"]
}
```
This configuration guarantees that `src/index.js` inspects the HTTP headers for root requests before static assets can respond.

### 5.2 Resilient metadata harvesting
The script `scripts/fetchRepoMetadata.js` executes inside Node.js environments:
- In Node.js 18 and newer, it utilizes global `fetch`.
- In legacy runtimes, it falls back to `node-fetch`.
- It supports optional bearer token authentication via `process.env.GITHUB_TOKEN`, raising API quota from 60 requests/hour to 5,000 requests/hour.
- When an individual repository fetch fails, the script captures the error, outputs a diagnostic warning, constructs a valid zeroed placeholder, and completes processing. This protects the deployment from total pipeline halts caused by transient upstream GitHub API rate limits.

### 5.3 Atomic commit-folding CI algorithm
Daily cron jobs can introduce excessive commit clutter. The workflow in `.github/workflows/fetch-repo-metadata.yml` executes an atomic folding algorithm:

1. **Diff verification:** If the freshly fetched `public/data/projects.json` matches `HEAD`, the process exits immediately with code 0.
2. **Soft reset folding:** The script inspects the commit author and subject. If the preceding commits were generated by `github-actions[bot]` with the standard automated subject, it executes `git reset --soft HEAD~1` up to 5 times.
3. **Parent isolation:** It executes `git checkout HEAD -- .` to discard changes to any other file, ensuring only the target metadata file changes.
4. **Lease-safe push:** The commit is pushed via `git push --force-with-lease`.
5. **Conflict recovery:** If a human contributor pushed to `main` during execution, the push lease fails. The script fetches `origin/main`, reapplies the generated file onto the current tip, and completes a non-force push.

---

## 6. Performance, economics, and security

### 6.1 Performance metrics
- **Static asset delivery:** Sub-20ms global latency served from Cloudflare edge caches.
- **Worker Markdown rendering:** Sub-5ms execution time with zero cold-start penalty on Cloudflare V8 isolates.
- **Payload efficiency:** The entire project directory consumes approximately 3 KB in Markdown, compared to over 45 KB for typical client-rendered frameworks.

### 6.2 Economic model
OSPS runs entirely within free-tier operational limits:
- Cloudflare Workers Free Tier provides 100,000 worker requests per day and unlimited static asset bandwidth.
- GitHub Actions provides sufficient free runner minutes to execute the once-daily metadata synchronization.
- Hosting cost is zero dollars per month.

### 6.3 Security posture
- **Zero backend attack surface:** There are no databases, server daemons, or runtime containers to compromise.
- **Read-only edge execution:** The worker runtime performs only read operations against static assets.
- **Isolated credentials:** GitHub API tokens are confined strictly to CI execution environments and never embedded into client code or worker bundles.

---

## 7. Future roadmap

### Phase 1: Multi-provider federation
Activate the currently dormant `gitlab`, `gitee`, and `bitbucket` structures in `data/projects.json` with provider-specific API fetchers in `scripts/fetchRepoMetadata.js`.

### Phase 2: Client-side search and topic filtering
Introduce an accessible, dependency-free client filter that enables instant search by project name, description, and topic chips without server round-trips.

### Phase 3: WebMCP and agent discovery endpoints
Expose standardized discovery endpoints (`/.well-known/ai-plugin.json` or WebMCP endpoints) to allow coding agents to query specific project metadata programmatically.
