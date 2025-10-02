
<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

<div align="center">
  <a href="https://github.com/LoveDoLove/open-source-projects">
    <img src="images/icon.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Open Source Projects Showcase</h3>

  <p align="center">
    Discover and explore a curated collection of open source projects from GitHub and other platforms.
    <br />
    <a href="https://github.com/LoveDoLove/open-source-projects"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/LoveDoLove/open-source-projects">View Demo</a>
    &middot;
    <a href="https://github.com/LoveDoLove/open-source-projects/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/LoveDoLove/open-source-projects/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#features">Features</a></li>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

## About The Project

Open Source Projects Showcase is a web application that curates and displays a collection of open source projects from GitHub and other platforms. It provides a visually appealing, accessible, and responsive interface for users to discover, explore, and contribute to open source projects.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Features

- Curated list of open source projects from GitHub (expandable to GitLab, Gitee, Bitbucket)
- Dynamic project metadata fetching (stars, forks, topics, etc.) via GitHub API
- Responsive and accessible UI with modern design
- Easy to add new projects via JSON configuration
- Cloudflare Workers deployment for fast, global delivery
- SEO and social sharing optimized

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- [HTML5](https://developer.mozilla.org/docs/Web/Guide/HTML/HTML5)
- [CSS3](https://developer.mozilla.org/docs/Web/CSS)
- [JavaScript (ES6+)](https://developer.mozilla.org/docs/Web/JavaScript)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

Install npm if you do not have it:
```sh
npm install npm@latest -g
```

Install Wrangler globally:
```sh
npm install -g wrangler
```

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/LoveDoLove/open-source-projects.git
   cd open-source-projects
   ```
2. Install dependencies
   ```sh
   npm install
   ```
3. (Optional) Update project metadata from GitHub
   ```sh
   node scripts/fetchRepoMetadata.js
   ```
4. Start the development server
   ```sh
   npm run dev
   ```
5. Deploy to Cloudflare Workers
   ```sh
   npm run deploy
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

Once running, visit the site in your browser. Browse the list of open source projects, view project details, and follow links to GitHub repositories. To add your own project, edit `data/projects.json` and run the metadata fetch script.

For more usage examples, refer to the [Documentation](https://github.com/LoveDoLove/open-source-projects).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/LoveDoLove/open-source-projects/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LoveDoLove/open-source-projects" alt="contrib.rocks image" />
</a>

## License

Distributed under the MIT License. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

LoveDoLove - [@LoveDoLove](https://github.com/LoveDoLove)

Project Link: [https://github.com/LoveDoLove/open-source-projects](https://github.com/LoveDoLove/open-source-projects)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [node-fetch](https://www.npmjs.com/package/node-fetch)
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[contributors-shield]: https://img.shields.io/github/contributors/LoveDoLove/open-source-projects.svg?style=for-the-badge
[contributors-url]: https://github.com/LoveDoLove/open-source-projects/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/LoveDoLove/open-source-projects.svg?style=for-the-badge
[forks-url]: https://github.com/LoveDoLove/open-source-projects/network/members
[stars-shield]: https://img.shields.io/github/stars/LoveDoLove/open-source-projects.svg?style=for-the-badge
[stars-url]: https://github.com/LoveDoLove/open-source-projects/stargazers
[issues-shield]: https://img.shields.io/github/issues/LoveDoLove/open-source-projects.svg?style=for-the-badge
[issues-url]: https://github.com/LoveDoLove/open-source-projects/issues
[license-shield]: https://img.shields.io/github/license/LoveDoLove/open-source-projects.svg?style=for-the-badge
[license-url]: https://github.com/LoveDoLove/open-source-projects/blob/main/LICENSE