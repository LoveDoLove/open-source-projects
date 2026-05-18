// scripts/fetchRepoMetadata.js
// Fetches repo metadata from GitHub API and updates public/data/projects.json

const fs = require('fs');
const path = require('path');
let fetch = global.fetch;
if (!fetch) {
  fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
}

const SOURCE = path.join(__dirname, '../data/projects.json');
const OUTPUT = path.join(__dirname, '../public/data/projects.json');
const GITHUB_API = 'https://api.github.com/repos';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

async function fetchGitHubRepo(username, repo) {
  const url = `${GITHUB_API}/${username}/${repo}`;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'open-source-projects'
  };
  
  // Add authentication header if token is available
  if (GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;
  }
  
  try {
    const res = await fetch(url, { headers });
    
    if (!res.ok) {
      const contentType = res.headers.get('content-type');
      let errorMessage = `HTTP ${res.status} ${res.statusText}`;
      
      try {
        if (contentType?.includes('application/json')) {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }
      } catch (parseErr) {
        // Failed to parse error response, use status message
      }
      
      console.warn(`⚠️  Failed to fetch ${username}/${repo}: ${errorMessage}`);
      return null;
    }
    
    const data = await res.json();
    console.log(`✓ Fetched ${username}/${repo}`);
    return data;
  } catch (error) {
    console.warn(`⚠️  Error fetching ${username}/${repo}: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('Starting metadata fetch...');
  if (GITHUB_TOKEN) {
    console.log('Using GitHub authentication token (5000 requests/hour)');
  } else {
    console.log('No GITHUB_TOKEN found. Using unauthenticated requests (60 requests/hour per IP)');
  }
  
  const raw = fs.readFileSync(SOURCE, 'utf-8');
  const accountsList = JSON.parse(raw);
  
  for (const accountObj of accountsList) {
    for (const provider of ['github']) {
      const providerAccounts = accountObj[provider];
      if (Array.isArray(providerAccounts)) {
        for (const acc of providerAccounts) {
          if (acc.username && Array.isArray(acc.projects)) {
            console.log(`\nProcessing ${acc.projects.length} projects for ${acc.username}...`);
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
  console.log(`\n✓ Metadata saved to ${OUTPUT}`);
}

main().catch(err => {
  console.error('Metadata fetch failed:', err);
  process.exit(1);
});