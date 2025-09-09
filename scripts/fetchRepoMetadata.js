// scripts/fetchRepoMetadata.js
// Fetches repo metadata from GitHub API and updates public/data/projects.json

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const SOURCE = path.join(__dirname, '../data/projects.json');
const OUTPUT = path.join(__dirname, '../public/data/projects.json');
const GITHUB_API = 'https://api.github.com/repos';

async function fetchGitHubRepo(username, repo) {
  const url = `${GITHUB_API}/${username}/${repo}`;
  const res = await fetch(url, {
    headers: { 'Accept': 'application/vnd.github+json' }
  });
  if (!res.ok) return null;
  return await res.json();
}

async function main() {
  const raw = fs.readFileSync(SOURCE, 'utf-8');
  const accountsList = JSON.parse(raw);
  for (const accountObj of accountsList) {
    for (const provider of ['github']) {
      const providerAccounts = accountObj[provider];
      if (Array.isArray(providerAccounts)) {
        for (const acc of providerAccounts) {
          if (acc.username && Array.isArray(acc.projects)) {
            acc.metadata = [];
            for (const repo of acc.projects) {
              const meta = await fetchGitHubRepo(acc.username, repo);
              acc.metadata.push({
                repo,
                name: meta?.name || repo,
                description: meta?.description || '',
                html_url: meta?.html_url || '',
                homepage: meta?.homepage || '',
                stargazers_count: meta?.stargazers_count || 0,
                forks_count: meta?.forks_count || 0,
                topics: meta?.topics || [],
                updated_at: meta?.updated_at || ''
              });
            }
          }
        }
      }
    }
  }
  fs.writeFileSync(OUTPUT, JSON.stringify(accountsList, null, 2));
}

main().catch(err => {
  console.error('Metadata fetch failed:', err);
  process.exit(1);
});