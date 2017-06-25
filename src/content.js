import 'webext-dynamic-content-scripts';
import {escape as esc} from 'escape-goat';
import githubInjection from 'github-injection';
import parseRepoUrl from './lib/parse-repo-url';
import html from './lib/parse-html';

function getPkgUrl(name) {
  return 'https://registry.npmjs.org/' + name.replace('/', '%2F');
}

function isGitLab() {
  return Boolean(document.querySelector('.navbar-gitlab'));
}

async function init() {
  const packageLink = document.querySelector('[class*="file"] a[title="package.json"]');
  if (!packageLink || document.querySelector('.npmhub-header')) {
    return;
  }

  const dependenciesBox = createBox('Dependencies');
  const pkg = await fetchPackageJson(packageLink);

  const dependencies = Object.keys(pkg.dependencies || {});
  const devDependencies = Object.keys(pkg.devDependencies || {});

  addDependencies(dependenciesBox, dependencies);

  // Don't show dev dependencies if there are absolutely no dependencies
  if (dependencies.length > 0 || devDependencies.length > 0) {
    addDependencies(createBox('Dev Dependencies'), devDependencies);
  }

  if (!pkg.private && pkg.name) {
    fetch(getPkgUrl(pkg.name)).then(r => r.json())
    .then(realPkg => {
      if (realPkg.name) { // If 404, realPkg === {}
        const link = html`<a class="btn btn-sm">Open on npmjs.com`;
        link.href = `https://www.npmjs.com/package/${esc(pkg.name)}`;
        dependenciesBox.firstChild.appendChild(link);

        if (dependencies.length > 0) {
          const link = html`<a class="btn btn-sm">Visualize full tree`;
          link.href = `http://npm.anvaka.com/#/view/2d/${esc(pkg.name)}`;
          dependenciesBox.firstChild.appendChild(link);
        }
      }
    }, err => {
      console.warn('npmhub: there was an error while pinging the current package on npmjs.org', err);
    });
  }
}

async function fetchPackageJson(link) {
  // https://gitlab.com/user/repo/blob/master/package.json
  // https://github.com/user/repo/blob/master/package.json
  const url = link.href.replace(/(gitlab[.]com[/].+[/].+[/])blob/, '$1raw');

  // GitLab will return a raw JSON
  // GitHub will return an HTML page
  let pkg = await fetch(url, {
    credentials: 'include'
  }).then(r => r.text());

  // Parse the JSON string out of the HTML page
  if (!isGitLab()) {
    pkg = html(pkg).querySelector('.blob-wrapper').textContent;
  }

  return JSON.parse(pkg);
}

function createBox(title) {
  const boxTemplate = document.querySelector('#readme, .readme-holder');
  const containerEl = document.createElement(boxTemplate.tagName);
  containerEl.classList = boxTemplate.classList;
  containerEl.appendChild(html`<div class="npmhub-header">`);
  containerEl.appendChild(isGitLab() ?
    html`<div class="file-title"><strong>${title}` :
    html`<h3>${title}`
  );
  containerEl.appendChild(html`<ol class="npmhub-deps markdown-body">`);

  boxTemplate.parentNode.appendChild(containerEl);
  return containerEl;
}

function addDependencies(containerEl, list) {
  const listEl = containerEl.querySelector('.npmhub-deps');
  if (list.length > 0) {
    list.forEach(async name => {
      const depEl = html`<li><a href='http://ghub.io/${esc(name)}'>${esc(name)}</a>&nbsp;</li>`;
      listEl.appendChild(depEl);
      const dep = await fetch(getPkgUrl(name)).then(r => r.json());
      depEl.appendChild(html(esc(dep.description)));
      depEl.querySelector('a').href = parseRepoUrl(dep);
    });
  } else {
    listEl.appendChild(html`<li class="npmhub-empty">No dependencies! 🎉</li>`);
  }
}

githubInjection(window, init);
