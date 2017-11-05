import 'webext-dynamic-content-scripts';
import {escape as esc} from 'escape-goat';
import githubInjection from 'github-injection';
import select from 'select-dom';
import parseRepoUrl from './lib/parse-repo-url';
import html from './lib/parse-html';
import elementReady from './lib/element-ready';

function getPkgUrl(name) {
  return 'https://registry.npmjs.org/' + name.replace('/', '%2F');
}

function isGitLab() {
  return select.exists('.navbar-gitlab');
}

function isPackageJson() {
  const breadcrumb = select('.breadcrumb .final-path, .breadcrumb li:last-child strong');
  return breadcrumb && breadcrumb.textContent === 'package.json';
}

function addHeaderLink(box, name, url) {
  box.firstElementChild.append(html`
    <a class="btn btn-sm" href="${url}">${name}</a>
  `);
}

function getPackageURL() {
  if (isPackageJson()) {
    return location.href;
  }
  const packageLink = select([
    '.files [title="package.json"]', // GitHub
    '.tree-item-file-name [title="package.json"]' // GitLab
  ].join(','));
  if (packageLink) {
    return packageLink.href;
  }
}

async function init() {
  if (select('.npmhub-header')) {
    return;
  }

  const packageURL = getPackageURL();
  if (!packageURL) {
    return;
  }

  const container = select([
    '.repository-content', // GitHub
    '.tree-content-holder', // GitLab
    '.blob-content-holder' // GitLab package.json page
  ].join(','));

  const dependenciesBox = createBox('Dependencies', container);
  if (!isPackageJson()) {
    addHeaderLink(dependenciesBox, 'See package.json', packageURL);
  }

  const pkg = await fetchPackageJson(packageURL);
  const dependencies = Object.keys(pkg.dependencies || {});
  addDependencies(dependenciesBox, dependencies);

  [
    'peer',
    'bundled',
    'optional',
    'dev'
  ].forEach(depType => {
    let list = pkg[depType + 'Dependencies'] || [];
    if (!Array.isArray(list)) {
      list = Object.keys(list);
    }
    if (list.length > 0) {
      const title = depType[0].toUpperCase() + depType.substr(1) + ' Dependencies';
      addDependencies(createBox(title, container), list);
    }
  });

  if (!pkg.private && pkg.name) {
    fetch(getPkgUrl(pkg.name)).then(r => r.json())
    .then(realPkg => {
      if (realPkg.name) { // If 404, realPkg === {}
        addHeaderLink(
          dependenciesBox,
          'Open on npmjs.com',
          `https://www.npmjs.com/package/${esc(pkg.name)}`
        );
        if (dependencies.length > 0) {
          addHeaderLink(
            dependenciesBox,
            'Visualize full tree',
            `http://npm.anvaka.com/#/view/2d/${esc(pkg.name)}`
          );
        }
      }
    }, err => {
      console.warn('npmhub: there was an error while pinging the current package on npmjs.org', err);
    });
  }
}

async function fetchPackageJson(url) {
  let dom = document;
  if (!isPackageJson()) {
    // https://gitlab.com/user/repo/raw/master/package.json
    // https://github.com/user/repo/blob/master/package.json
    url = url.replace(/(gitlab[.]com[/].+[/].+[/])blob/, '$1raw');

    const body = await fetch(url, {
      credentials: 'include'
    }).then(r => r.text());

    // GitLab will return raw JSON
    // GitHub will return an HTML page
    if (isGitLab()) {
      return JSON.parse(body);
    }
    dom = html(body);
  }

  // ElementReady required for GitLab's deferred content load
  const jsonEl = await elementReady('.blob-wrapper table, .blob-viewer pre', dom);

  return JSON.parse(jsonEl.textContent);
}

function createBox(title, container) {
  const box = html`
    <div class="readme boxed-group file-holder readme-holder">
      <div class="npmhub-header"></div>
      ${
        isGitLab() ?
        `<div class="file-title"><strong>${title}</strong></div>` :
        `<h3>${title}</h3>`
      }
      <ol class="npmhub-deps markdown-body"></ol>
    </div>
  `;

  container.append(box);
  return box;
}

function addDependencies(containerEl, list) {
  const listEl = containerEl.querySelector('.npmhub-deps');
  if (list.length > 0) {
    list.forEach(async name => {
      const depEl = html`
        <li>
          <a href='https://www.npmjs.com/package/${esc(name)}'>
            ${esc(name)}
          </a>
          &nbsp;
        </li>
      `;
      listEl.append(depEl);
      const dep = await fetch(getPkgUrl(name)).then(r => r.json());
      depEl.append(dep.description);

      const url = parseRepoUrl(dep);
      if (url) {
        depEl.querySelector('a').href = url;
      }
    });
  } else {
    listEl.append(html`
      <li class="npmhub-empty">
        No dependencies!
        <g-emoji alias="tada" class="emoji" fallback-src="https://assets-cdn.github.com/images/icons/emoji/unicode/1f389.png" ios-version="6.0">🎉</g-emoji>
      </li>
    `);
  }
}

githubInjection(init);
