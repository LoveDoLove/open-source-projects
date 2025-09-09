// public/index.js
// Refactored project display logic for maintainability and modularity

/**
 * Fetches project data from the JSON file.
 * @returns {Promise<Array>} Array of project objects.
 */
async function fetchProjects() {
  const response = await fetch('/data/projects.json');
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
          if (acc.username && Array.isArray(acc.projects)) {
            acc.projects.forEach(repo => {
              projects.push({
                provider,
                username: acc.username,
                name: repo.name || repo,
                description: repo.description || '',
                github_url: repo.github_url || '',
                hostname: repo.hostname || '',
                ...repo
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
  const card = document.createElement('article');
  card.className = 'project-card';

  const title = document.createElement('h2');
  title.className = 'project-title';
  title.textContent = project.name || 'Unnamed Project';
  card.appendChild(title);

  const description = document.createElement('p');
  description.className = 'project-description';
  description.textContent = project.description || 'No description available.';
  card.appendChild(description);

  const linksContainer = document.createElement('div');
  linksContainer.className = 'project-links';

  if (project.github_url) {
    linksContainer.appendChild(createGitHubLink(project.github_url));
  }
  if (project.hostname) {
    linksContainer.appendChild(createRedirectLink(project.hostname));
  }

  card.appendChild(linksContainer);
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
function createRedirectLink(hostname) {
  const link = document.createElement('a');
  link.href = hostname;
  link.className = 'project-link redirect-link';
  link.textContent = 'Visit Project Website';
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'Visit project website (opens in new tab)');
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