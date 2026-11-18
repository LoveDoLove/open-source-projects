# System architecture

This document explains the runtime architecture and edge content delivery model of Open Source Projects.

## Overview

The application runs on Cloudflare Workers using the Static Assets feature. It serves two distinct client types from a single edge endpoint:

1. Web browsers receive an accessible, static HTML/CSS/JavaScript single-page application.
2. AI agents and HTTP clients requesting Markdown receive structured, token-efficient Markdown without HTML boilerplate.

```
                          +------------------------+
                          |   Incoming HTTP Request|
                          +-----------+------------+
                                      |
                                      v
                          +-----------+------------+
                          | Cloudflare Edge Worker |
                          |     (src/index.js)     |
                          +-----------+------------+
                                      |
            +-------------------------+-------------------------+
            |                                                   |
Accept: text/markdown                               Other Accept headers
on / or /index.html                                 (e.g., text/html)
            |                                                   |
            v                                                   v
+-----------+------------+                          +-----------+------------+
| Fetch /data/           |                          | Pass through to        |
| projects.json from     |                          | env.ASSETS.fetch()     |
| env.ASSETS             |                          +-----------+------------+
+-----------+------------+                                      |
            |                                                   v
            v                                       +-----------+------------+
| Transform JSON into    |                          | Serve public/index.html|
| clean Markdown document|                          | and static assets      |
+-----------+------------+                          +-----------+------------+
            |                                                   |
            v                                                   v
+-----------+------------+                          +-----------+------------+
| Response with headers: |                          | Client-side JavaScript |
| - Vary: Accept         |                          | fetches projects.json  |
| - x-markdown-tokens    |                          | and renders cards      |
+------------------------+                          +------------------------+
```

## Edge runtime and routing

Cloudflare Workers routes traffic using the configuration in `wrangler.jsonc`.

### Asset binding and worker execution

The worker configuration specifies:

```jsonc
{
  "name": "open-source-projects",
  "main": "src/index.js",
  "compatibility_date": "2025-08-28",
  "assets": {
    "directory": "./public",
    "binding": "ASSETS",
    "run_worker_first": ["/", "/index.html"]
  }
}
```

The `run_worker_first` array is essential. By default, Cloudflare Workers serves matching files from the static asset directory before executing worker code. Specifying `["/", "/index.html"]` forces Cloudflare to run `src/index.js` first when a client requests the root path. Without this rule, the static asset layer serves `public/index.html` directly, and content negotiation never executes.

### Content negotiation for AI agents

AI coding assistants and LLM crawlers frequently consume web pages to gather context. Scraping raw HTML consumes thousands of tokens on navigation, scripts, and markup wrappers.

When a client sends an HTTP request with `Accept: text/markdown` to `/` or `/index.html`, `src/index.js` intercepts the request:

1. It reads `/data/projects.json` directly from the internal `env.ASSETS` binding.
2. It parses the JSON payload containing repository metadata.
3. It converts the project records into clean Markdown. Each entry includes project name, repository link, description, star count, fork count, update date, topics, and homepage.
4. It computes an estimated token count as `ceil(markdown.length / 4)`.
5. It returns the response with dedicated metadata headers:
   - `content-type: text/markdown; charset=utf-8`
   - `vary: Accept` (ensures edge caches do not serve Markdown to browsers or HTML to agents)
   - `cache-control: public, max-age=3600`
   - `x-markdown-tokens: <token_count>`

### Static asset pass-through

For all other requests, including standard browser page views, image assets, scripts, and styles, the worker calls:

```javascript
return env.ASSETS.fetch(request);
```

This passes execution directly to Cloudflare edge asset storage with zero compute overhead.

## Client-side architecture

The browser experience uses plain web standards without frontend frameworks or build steps.

### Entry points

- `public/index.html`: semantic HTML layout with an accessible container (`<section id="projects-container">`).
- `public/style.css` and `public/style.min.css`: modern card layout with CSS grid, custom properties, and responsive breakpoints.
- `public/index.js` and `public/index.min.js`: client script that runs after DOM content loads.

### Hydration sequence

1. The browser loads `index.html` and displays a lightweight loading placeholder.
2. `index.min.js` issues a `fetch('/data/projects.json')` call.
3. The script iterates over the returned project records.
4. For each project, it builds a semantic DOM card containing repository metadata, topic chips, and external links.
5. The script appends all generated elements to the document using a single `DocumentFragment` to avoid layout thrashing.
