// public/index.js
// Refactored project display logic for maintainability and modularity

/**
 * Fetches project data from the JSON file.
 * @returns {Promise<Array>} Array of project objects.
 */
async function fetchProjects() {
  const hostname = window.location.hostname;
  const responseUrl = hostname === 'localhost' ? '/data/projects.json' : '/data/projects.json';
  const response = await fetch(responseUrl);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const accountsList = await response.json();
  const projects = [];
  ['github', 'gitlab', 'gitee', 'bitbucket'].forEach(provider => {
    accountsList.forEach(accountObj => {
      const providerAccounts = accountObj[provider];
      if (Array.isArray(providerAccounts)) {
        providerAccounts.forEach(acc => {
          if (Array.isArray(acc.metadata)) {
            acc.metadata.forEach(meta => {
              // Ensure all fields are strings or numbers, not arrays
              projects.push({
                name: typeof meta.name === 'string' ? meta.name : Array.isArray(meta.name) ? meta.name.join(', ') : '',
                description: typeof meta.description === 'string' ? meta.description : Array.isArray(meta.description) ? meta.description.join(', ') : '',
                topics: Array.isArray(meta.topics) ? meta.topics : [],
                stargazers_count: typeof meta.stargazers_count === 'number' ? meta.stargazers_count : 0,
                forks_count: typeof meta.forks_count === 'number' ? meta.forks_count : 0,
                html_url: typeof meta.html_url === 'string' ? meta.html_url : '',
                homepage: typeof meta.homepage === 'string' ? meta.homepage : '',
              });
            });
          }
        });
      }
    });
  });
  return projects;
}

/**
 * Renders the list of projects to the DOM.
 * @param {Array} projects - Array of project objects to render.
 */
function renderProjects(projects) {
  const container = document.getElementById('projects-container');
  container.innerHTML = '';
  if (!projects.length) {
    container.innerHTML = '<div class="loading">No projects found.</div>';
    return;
  }
  const fragment = document.createDocumentFragment();
  projects.forEach(project => {
    const card = createProjectCard(project);
    fragment.appendChild(card);
  });
  container.appendChild(fragment);
}

/**
 * Creates a DOM element for a single project card.
 * @param {Object} project - Project object.
 * @returns {HTMLElement} DOM element representing the project card.
 */
function createProjectCard(project) {
  // Ensure all rendered fields are proper strings, not arrays
  const safeName = typeof project.name === 'string' ? project.name : Array.isArray(project.name) ? project.name.join(', ') : '';
  const safeDescription = typeof project.description === 'string' ? project.description : Array.isArray(project.description) ? project.description.join(', ') : '';
  const safeTopics = Array.isArray(project.topics) ? project.topics : typeof project.topics === 'string' ? [project.topics] : [];

  const card = document.createElement('article');
  card.className = 'project-card';

  // Title
  const title = document.createElement('h2');
  title.className = 'project-title';
  title.textContent = safeName || 'Unnamed Project';
  card.appendChild(title);

  // Description
  const description = document.createElement('p');
  description.className = 'project-description';
  description.textContent = safeDescription || 'No description available.';
  card.appendChild(description);

  // Topics
  if (safeTopics.length > 0) {
    const topicsRow = document.createElement('div');
    topicsRow.className = 'project-topics-row';
    safeTopics.forEach(topic => {
      const chip = document.createElement('span');
      chip.className = 'topic-chip';
      chip.textContent = topic;
      topicsRow.appendChild(chip);
    });
    card.appendChild(topicsRow);
  }

  // Metadata fields
  const metaContainer = document.createElement('div');
  metaContainer.className = 'project-meta';

  // Stargazers
  if (typeof project.stargazers_count === 'number') {
    const stars = document.createElement('span');
    stars.className = 'project-stars';
    stars.textContent = `⭐ Stars: ${project.stargazers_count}`;
    metaContainer.appendChild(stars);
  }

  // Forks
  if (typeof project.forks_count === 'number') {
    const forks = document.createElement('span');
    forks.className = 'project-forks';
    forks.textContent = `🍴 Forks: ${project.forks_count}`;
    metaContainer.appendChild(forks);
  }

  // (Removed last updated field per requirements)

  card.appendChild(metaContainer);

  // Links
  const linksContainer = document.createElement('div');
  linksContainer.className = 'project-links';

  // GitHub URL (html_url)
  if (project.html_url) {
    linksContainer.appendChild(createGitHubLink(project.html_url));
  }
  // Homepage
  if (project.homepage && project.homepage !== project.html_url) {
    linksContainer.appendChild(createRedirectLink(project.homepage, 'Project Homepage'));
  }
  // (Removed legacy/hostname link per requirements)

  card.appendChild(linksContainer);

  // Display any other metadata fields not explicitly rendered
  const knownFields = [
    'name', 'description', 'topics', 'stargazers_count', 'forks_count', 'updated_at',
    'html_url', 'homepage', 'hostname', 'github_url', 'provider', 'username', 'repo'
  ];
  Object.keys(project).forEach(key => {
    if (!knownFields.includes(key)) {
      const extra = document.createElement('div');
      extra.className = 'project-extra';
      let value = project[key];
      // If value is an array of single characters, join as string
      if (Array.isArray(value) && value.every(c => typeof c === 'string' && c.length === 1)) {
        value = value.join('');
      } else if (Array.isArray(value)) {
        value = value.join(', ');
      }
      extra.textContent = `${key}: ${value}`;
      card.appendChild(extra);
    }
  });

  return card;
}

/**
 * Creates a GitHub link element.
 * @param {string} githubUrl - The GitHub URL for the project.
 * @returns {HTMLElement} Anchor element linking to GitHub.
 */
function createGitHubLink(githubUrl) {
  const link = document.createElement('a');
  link.href = githubUrl;
  link.className = 'project-link github-link';
  link.textContent = 'View on GitHub';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'View project on GitHub (opens in new tab)');
  link.setAttribute('tabindex', '0');
  return link;
}

/**
 * Creates a redirect link to the project's website.
 * @param {string} hostname - The hostname for the project.
 * @returns {HTMLElement} Anchor element linking to the project's website.
 */
function createRedirectLink(url, label = 'Visit Project Website') {
  const link = document.createElement('a');
  link.href = url;
  link.className = 'project-link redirect-link';
  link.textContent = label;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${label} (opens in new tab)`);
  link.setAttribute('tabindex', '0');
  return link;
}

/**
 * Displays an error message to the user.
 * @param {string} message - Error message to display.
 */
function displayError(message) {
  const container = document.getElementById('projects-container');
  container.innerHTML = `<div class="error">${message}</div>`;
}

/**
 * Initializes the project showcase.
 */
async function initializeProjectShowcase() {
  try {
    const projects = await fetchProjects();
    renderProjects(projects);
  } catch (error) {
    displayError('Failed to load projects. Please try again later.');
    console.error('Error initializing project showcase:', error);
  }
}

document.addEventListener('DOMContentLoaded', initializeProjectShowcase);