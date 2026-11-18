# Contributing to Open Source Projects

Thank you for your interest in contributing! This project is a community effort, and any contribution—no matter how small—is greatly appreciated.

## Code of Conduct

Please be respectful and welcoming to everyone in our community.

## How to contribute

### Adding a new project

1. **Fork the repository.**
2. **Edit `data/projects.json`:** Add your repository to the appropriate platform section (e.g., `github`).
3. **Commit and push:** Create a descriptive branch, commit your changes, and push to your fork.
4. **Open a Pull Request:** Submit a PR against the `main` branch.

Our automated pipeline (`scripts/fetchRepoMetadata.js`) will run upon commit to fetch metadata (stars, forks, topics, etc.) and update `public/data/projects.json`.

### Reporting bugs or requesting features

Please use the provided GitHub issue templates:

- [Report a Bug](https://github.com/LoveDoLove/open-source-projects/issues/new?labels=bug&template=bug-report---.md)
- [Request a Feature](https://github.com/LoveDoLove/open-source-projects/issues/new?labels=enhancement&template=feature-request---.md)

## Development workflow

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [pnpm](https://pnpm.io/) (the project uses `pnpm-workspace.yaml`)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Setup

1. **Clone and install:**
   ```sh
   git clone https://github.com/LoveDoLove/open-source-projects.git
   cd open-source-projects
   pnpm install
   ```

2. **Run locally:**
   ```sh
   pnpm dev
   ```

3. **Verify metadata generation:**
   ```sh
   # (Optional) Manually trigger metadata fetch
   node scripts/fetchRepoMetadata.js
   ```

## Documentation guidelines

When improving or adding documentation:

- Use [Diátaxis](https://diataxis.fr/) principles.
- Apply the `technical-writing` and `unslop` standards (see `.agents/skills`).
- Keep docs in the `docs/` directory.
- Use sentence case for headings.
